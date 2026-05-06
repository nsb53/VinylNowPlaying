import AudioToolbox
import CoreAudio
import Foundation

final class MeterState {
    var windowStartedAt = Date()
    var leftSampleCount = 0
    var rightSampleCount = 0
    var leftSquareSum = 0.0
    var rightSquareSum = 0.0
    var leftPeak = 0
    var rightPeak = 0
    let windowSeconds: Double
    let stream: Bool

    init(windowSeconds: Double, stream: Bool) {
        self.windowSeconds = windowSeconds
        self.stream = stream
    }

    func reset() {
        windowStartedAt = Date()
        leftSampleCount = 0
        rightSampleCount = 0
        leftSquareSum = 0.0
        rightSquareSum = 0.0
        leftPeak = 0
        rightPeak = 0
    }
}

func propertyAddress(_ selector: AudioObjectPropertySelector,
                     _ scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal,
                     _ element: AudioObjectPropertyElement = kAudioObjectPropertyElementMain) -> AudioObjectPropertyAddress {
    AudioObjectPropertyAddress(mSelector: selector, mScope: scope, mElement: element)
}

func stringProperty(_ objectID: AudioObjectID, _ selector: AudioObjectPropertySelector) -> String {
    var address = propertyAddress(selector)
    var size = UInt32(MemoryLayout<CFString>.size)
    var value: CFString = "" as CFString
    let status = AudioObjectGetPropertyData(objectID, &address, 0, nil, &size, &value)
    return status == noErr ? value as String : ""
}

func deviceID(named query: String) -> AudioObjectID? {
    var address = propertyAddress(kAudioHardwarePropertyDevices)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size) == noErr else {
        return nil
    }

    let count = Int(size) / MemoryLayout<AudioObjectID>.size
    var devices = Array(repeating: AudioObjectID(), count: count)
    guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size, &devices) == noErr else {
        return nil
    }

    return devices.first { device in
        stringProperty(device, kAudioObjectPropertyName).localizedCaseInsensitiveContains(query)
    }
}

let targetName = CommandLine.arguments.dropFirst().first ?? "USB PnP Audio Device"
let seconds = Double(CommandLine.arguments.dropFirst(2).first ?? "0.5") ?? 0.5
let streamMode = CommandLine.arguments.contains("--stream")
let streamWindowSeconds = Double(CommandLine.arguments.dropFirst(3).first ?? "0.12") ?? 0.12
guard let device = deviceID(named: targetName) else {
    fatalError("No CoreAudio device matched '\(targetName)'.")
}

let uid = stringProperty(device, kAudioDevicePropertyDeviceUID) as CFString
let state = MeterState(windowSeconds: streamMode ? streamWindowSeconds : seconds, stream: streamMode)
let statePointer = Unmanaged.passRetained(state).toOpaque()
defer { Unmanaged<MeterState>.fromOpaque(statePointer).release() }

func db(_ value: Double) -> Double {
    value > 0 ? 20 * log10(value / 32768.0) : -120.0
}

func report(_ state: MeterState, json: Bool) {
    let leftRms = state.leftSampleCount > 0 ? sqrt(state.leftSquareSum / Double(state.leftSampleCount)) : 0
    let rightRms = state.rightSampleCount > 0 ? sqrt(state.rightSquareSum / Double(state.rightSampleCount)) : 0
    let combinedCount = state.leftSampleCount + state.rightSampleCount
    let combinedRms = combinedCount > 0 ? sqrt((state.leftSquareSum + state.rightSquareSum) / Double(combinedCount)) : 0

    let leftRmsDb = db(leftRms)
    let rightRmsDb = db(rightRms)
    let rmsDb = db(combinedRms)
    let leftPeakDb = db(Double(state.leftPeak))
    let rightPeakDb = db(Double(state.rightPeak))
    let peakDb = max(leftPeakDb, rightPeakDb)

    if json {
        print(String(format: "{\"rmsDb\":%.1f,\"peakDb\":%.1f,\"leftRmsDb\":%.1f,\"leftPeakDb\":%.1f,\"rightRmsDb\":%.1f,\"rightPeakDb\":%.1f}",
                     rmsDb,
                     peakDb,
                     leftRmsDb,
                     leftPeakDb,
                     rightRmsDb,
                     rightPeakDb))
        fflush(stdout)
    } else {
        print("leftSamples=\(state.leftSampleCount) rightSamples=\(state.rightSampleCount)")
        print(String(format: "rms=%.1f dBFS peak=%.1f dBFS", rmsDb, peakDb))
        print(String(format: "leftRms=%.1f dBFS leftPeak=%.1f dBFS rightRms=%.1f dBFS rightPeak=%.1f dBFS",
                     leftRmsDb,
                     leftPeakDb,
                     rightRmsDb,
                     rightPeakDb))
    }
}

var format = AudioStreamBasicDescription(
    mSampleRate: 48_000,
    mFormatID: kAudioFormatLinearPCM,
    mFormatFlags: kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked,
    mBytesPerPacket: 4,
    mFramesPerPacket: 1,
    mBytesPerFrame: 4,
    mChannelsPerFrame: 2,
    mBitsPerChannel: 16,
    mReserved: 0
)

let callback: AudioQueueInputCallback = { userData, queue, buffer, _, _, _ in
    guard let userData else { return }
    let state = Unmanaged<MeterState>.fromOpaque(userData).takeUnretainedValue()
    let samples = buffer.pointee.mAudioData.bindMemory(to: Int16.self,
                                                       capacity: Int(buffer.pointee.mAudioDataByteSize) / MemoryLayout<Int16>.size)
    let sampleTotal = Int(buffer.pointee.mAudioDataByteSize) / MemoryLayout<Int16>.size

    for index in 0..<sampleTotal {
        let sample = Int(samples[index])
        let absolute = abs(sample)
        if index % 2 == 0 {
            state.leftPeak = max(state.leftPeak, absolute)
            state.leftSquareSum += Double(sample * sample)
            state.leftSampleCount += 1
        } else {
            state.rightPeak = max(state.rightPeak, absolute)
            state.rightSquareSum += Double(sample * sample)
            state.rightSampleCount += 1
        }
    }

    if state.stream && Date().timeIntervalSince(state.windowStartedAt) >= state.windowSeconds {
        report(state, json: true)
        state.reset()
    }

    AudioQueueEnqueueBuffer(queue, buffer, 0, nil)
}

var queue: AudioQueueRef?
var status = AudioQueueNewInput(&format, callback, statePointer, nil, nil, 0, &queue)
guard status == noErr, let queue else {
    fatalError("AudioQueueNewInput failed with status \(status).")
}

var currentDevice = uid
status = AudioQueueSetProperty(queue,
                               kAudioQueueProperty_CurrentDevice,
                               &currentDevice,
                               UInt32(MemoryLayout<CFString>.size))
guard status == noErr else {
    fatalError("AudioQueueSetProperty(CurrentDevice) failed with status \(status).")
}

let bufferByteSize: UInt32 = 48_000 * 4 / 4
for _ in 0..<4 {
    var buffer: AudioQueueBufferRef?
    AudioQueueAllocateBuffer(queue, bufferByteSize, &buffer)
    if let buffer {
        AudioQueueEnqueueBuffer(queue, buffer, 0, nil)
    }
}

if !streamMode {
    print("Metering \(targetName) for \(seconds) seconds...")
}
AudioQueueStart(queue, nil)
RunLoop.current.run(until: Date().addingTimeInterval(streamMode ? 86400 : seconds))
AudioQueueStop(queue, true)
AudioQueueDispose(queue, true)

if !streamMode {
    report(state, json: false)
}
