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
    var spectrumSamples: [Double] = []
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
        spectrumSamples.removeAll(keepingCapacity: true)
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

func fft(real: inout [Double], imag: inout [Double]) {
    let count = real.count
    var j = 0
    for index in 1..<count {
        var bit = count >> 1
        while j & bit != 0 {
            j ^= bit
            bit >>= 1
        }
        j ^= bit
        if index < j {
            real.swapAt(index, j)
            imag.swapAt(index, j)
        }
    }

    var length = 2
    while length <= count {
        let angle = -2.0 * Double.pi / Double(length)
        let stepReal = cos(angle)
        let stepImag = sin(angle)
        var start = 0
        while start < count {
            var unitReal = 1.0
            var unitImag = 0.0
            for offset in 0..<(length / 2) {
                let even = start + offset
                let odd = even + length / 2
                let oddReal = real[odd] * unitReal - imag[odd] * unitImag
                let oddImag = real[odd] * unitImag + imag[odd] * unitReal
                real[odd] = real[even] - oddReal
                imag[odd] = imag[even] - oddImag
                real[even] += oddReal
                imag[even] += oddImag

                let nextReal = unitReal * stepReal - unitImag * stepImag
                let nextImag = unitReal * stepImag + unitImag * stepReal
                unitReal = nextReal
                unitImag = nextImag
            }
            start += length
        }
        length <<= 1
    }
}

func spectrumBands(from samples: [Double], sampleRate: Double, bandCount: Int = 32) -> [Double] {
    let fftSize = 2048
    guard samples.count >= fftSize else {
        return Array(repeating: 0.0, count: bandCount)
    }

    let source = Array(samples.suffix(fftSize))
    var real = Array(repeating: 0.0, count: fftSize)
    var imag = Array(repeating: 0.0, count: fftSize)
    for index in 0..<fftSize {
        let window = 0.5 - 0.5 * cos(2.0 * Double.pi * Double(index) / Double(fftSize - 1))
        real[index] = source[index] * window
    }

    fft(real: &real, imag: &imag)

    let minFrequency = 60.0
    let maxFrequency = min(16_000.0, sampleRate / 2.0)
    let logMin = log10(minFrequency)
    let logMax = log10(maxFrequency)
    let fullScaleMagnitude = 32768.0 * Double(fftSize) * 0.25

    return (0..<bandCount).map { band in
        let lowerFrequency = pow(10.0, logMin + (logMax - logMin) * Double(band) / Double(bandCount))
        let upperFrequency = pow(10.0, logMin + (logMax - logMin) * Double(band + 1) / Double(bandCount))
        let lowerBin = max(1, Int((lowerFrequency / sampleRate) * Double(fftSize)))
        let upperBin = min(fftSize / 2 - 1, max(lowerBin, Int((upperFrequency / sampleRate) * Double(fftSize))))
        var sum = 0.0
        var count = 0
        for bin in lowerBin...upperBin {
            sum += hypot(real[bin], imag[bin])
            count += 1
        }
        let average = count > 0 ? sum / Double(count) : 0.0
        let dbValue = average > 0 ? 20.0 * log10(average / fullScaleMagnitude) : -120.0
        return max(0.0, min(1.0, (dbValue + 78.0) / 66.0))
    }
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
    let bands = spectrumBands(from: state.spectrumSamples, sampleRate: 48_000)
    let bandJson = bands.map { String(format: "%.3f", $0) }.joined(separator: ",")

    if json {
        print(String(format: "{\"rmsDb\":%.1f,\"peakDb\":%.1f,\"leftRmsDb\":%.1f,\"leftPeakDb\":%.1f,\"rightRmsDb\":%.1f,\"rightPeakDb\":%.1f,\"spectrumBands\":[%@]}",
                     rmsDb,
                     peakDb,
                     leftRmsDb,
                     leftPeakDb,
                     rightRmsDb,
                     rightPeakDb,
                     bandJson))
        fflush(stdout)
    } else {
        print("leftSamples=\(state.leftSampleCount) rightSamples=\(state.rightSampleCount)")
        print(String(format: "rms=%.1f dBFS peak=%.1f dBFS", rmsDb, peakDb))
        print(String(format: "leftRms=%.1f dBFS leftPeak=%.1f dBFS rightRms=%.1f dBFS rightPeak=%.1f dBFS",
                     leftRmsDb,
                     leftPeakDb,
                     rightRmsDb,
                     rightPeakDb))
        print("spectrumBands=[\(bandJson)]")
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
    var frameIndex = 0
    while frameIndex + 1 < sampleTotal {
        let mono = (Double(samples[frameIndex]) + Double(samples[frameIndex + 1])) * 0.5
        state.spectrumSamples.append(mono)
        frameIndex += 2
    }
    if state.spectrumSamples.count > 4096 {
        state.spectrumSamples.removeFirst(state.spectrumSamples.count - 4096)
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
