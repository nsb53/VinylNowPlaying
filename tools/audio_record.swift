import AudioToolbox
import CoreAudio
import Foundation

final class RecorderState {
    let audioFile: AudioFileID
    var packetIndex: Int64 = 0
    var sampleCount = 0
    var squareSum = 0.0
    var peak = 0

    init(audioFile: AudioFileID) {
        self.audioFile = audioFile
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
let outputPath = CommandLine.arguments.dropFirst(2).first ?? "captures/sample.wav"
let seconds = Double(CommandLine.arguments.dropFirst(3).first ?? "15") ?? 15

guard let device = deviceID(named: targetName) else {
    fatalError("No CoreAudio device matched '\(targetName)'.")
}

try FileManager.default.createDirectory(atPath: (outputPath as NSString).deletingLastPathComponent,
                                        withIntermediateDirectories: true)

let uid = stringProperty(device, kAudioDevicePropertyDeviceUID) as CFString
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

var audioFile: AudioFileID?
let outputURL = URL(fileURLWithPath: outputPath) as CFURL
var status = AudioFileCreateWithURL(outputURL,
                                    kAudioFileWAVEType,
                                    &format,
                                    .eraseFile,
                                    &audioFile)
guard status == noErr, let audioFile else {
    fatalError("AudioFileCreateWithURL failed with status \(status).")
}

let state = RecorderState(audioFile: audioFile)
let statePointer = Unmanaged.passRetained(state).toOpaque()
defer {
    AudioFileClose(audioFile)
    Unmanaged<RecorderState>.fromOpaque(statePointer).release()
}

let callback: AudioQueueInputCallback = { userData, queue, buffer, _, packetCount, _ in
    guard let userData else { return }
    let state = Unmanaged<RecorderState>.fromOpaque(userData).takeUnretainedValue()
    var packets = packetCount
    if packets == 0 {
        packets = buffer.pointee.mAudioDataByteSize / 4
    }

    AudioFileWritePackets(state.audioFile,
                          false,
                          buffer.pointee.mAudioDataByteSize,
                          nil,
                          state.packetIndex,
                          &packets,
                          buffer.pointee.mAudioData)
    state.packetIndex += Int64(packets)

    let samples = buffer.pointee.mAudioData.bindMemory(to: Int16.self,
                                                       capacity: Int(buffer.pointee.mAudioDataByteSize) / MemoryLayout<Int16>.size)
    let sampleTotal = Int(buffer.pointee.mAudioDataByteSize) / MemoryLayout<Int16>.size
    for index in 0..<sampleTotal {
        let sample = Int(samples[index])
        let absolute = abs(sample)
        state.peak = max(state.peak, absolute)
        state.squareSum += Double(sample * sample)
    }
    state.sampleCount += sampleTotal

    AudioQueueEnqueueBuffer(queue, buffer, 0, nil)
}

var queue: AudioQueueRef?
status = AudioQueueNewInput(&format, callback, statePointer, nil, nil, 0, &queue)
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

print("Recording \(targetName) to \(outputPath) for \(seconds) seconds...")
AudioQueueStart(queue, nil)
RunLoop.current.run(until: Date().addingTimeInterval(seconds))
AudioQueueStop(queue, true)
AudioQueueDispose(queue, true)

let rms = state.sampleCount > 0 ? sqrt(state.squareSum / Double(state.sampleCount)) : 0
let rmsDb = rms > 0 ? 20 * log10(rms / 32768.0) : -Double.infinity
let peakDb = state.peak > 0 ? 20 * log10(Double(state.peak) / 32768.0) : -Double.infinity

print("wrote=\(outputPath) packets=\(state.packetIndex) samples=\(state.sampleCount)")
print(String(format: "rms=%.1f dBFS peak=%.1f dBFS", rmsDb, peakDb))
