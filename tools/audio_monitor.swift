import AudioToolbox
import CoreAudio
import Foundation

final class MonitorState {
    let outputQueue: AudioQueueRef

    init(outputQueue: AudioQueueRef) {
        self.outputQueue = outputQueue
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
let seconds = Double(CommandLine.arguments.dropFirst(2).first ?? "0") ?? 0
let outputName = CommandLine.arguments.dropFirst(3).first ?? "MacBook Pro Speakers"

guard let device = deviceID(named: targetName) else {
    fatalError("No CoreAudio device matched '\(targetName)'.")
}
guard let outputDevice = deviceID(named: outputName) else {
    fatalError("No CoreAudio output device matched '\(outputName)'.")
}

let uid = stringProperty(device, kAudioDevicePropertyDeviceUID) as CFString
let outputUid = stringProperty(outputDevice, kAudioDevicePropertyDeviceUID) as CFString
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

let outputCallback: AudioQueueOutputCallback = { _, queue, buffer in
    AudioQueueFreeBuffer(queue, buffer)
}

var outputQueue: AudioQueueRef?
var status = AudioQueueNewOutput(&format, outputCallback, nil, nil, nil, 0, &outputQueue)
guard status == noErr, let outputQueue else {
    fatalError("AudioQueueNewOutput failed with status \(status).")
}

var currentOutputDevice = outputUid
status = AudioQueueSetProperty(outputQueue,
                               kAudioQueueProperty_CurrentDevice,
                               &currentOutputDevice,
                               UInt32(MemoryLayout<CFString>.size))
guard status == noErr else {
    fatalError("AudioQueueSetProperty(OutputDevice) failed with status \(status).")
}

let state = MonitorState(outputQueue: outputQueue)
let statePointer = Unmanaged.passRetained(state).toOpaque()
defer { Unmanaged<MonitorState>.fromOpaque(statePointer).release() }

let inputCallback: AudioQueueInputCallback = { userData, inputQueue, inputBuffer, _, _, _ in
    guard let userData else { return }
    let state = Unmanaged<MonitorState>.fromOpaque(userData).takeUnretainedValue()

    var outputBuffer: AudioQueueBufferRef?
    let byteSize = inputBuffer.pointee.mAudioDataByteSize
    guard AudioQueueAllocateBuffer(state.outputQueue, byteSize, &outputBuffer) == noErr,
          let outputBuffer else {
        return
    }

    memcpy(outputBuffer.pointee.mAudioData, inputBuffer.pointee.mAudioData, Int(byteSize))
    outputBuffer.pointee.mAudioDataByteSize = byteSize
    AudioQueueEnqueueBuffer(state.outputQueue, outputBuffer, 0, nil)
    AudioQueueEnqueueBuffer(inputQueue, inputBuffer, 0, nil)
}

var inputQueue: AudioQueueRef?
status = AudioQueueNewInput(&format, inputCallback, statePointer, nil, nil, 0, &inputQueue)
guard status == noErr, let inputQueue else {
    fatalError("AudioQueueNewInput failed with status \(status).")
}

var currentDevice = uid
status = AudioQueueSetProperty(inputQueue,
                               kAudioQueueProperty_CurrentDevice,
                               &currentDevice,
                               UInt32(MemoryLayout<CFString>.size))
guard status == noErr else {
    fatalError("AudioQueueSetProperty(CurrentDevice) failed with status \(status).")
}

let bufferByteSize: UInt32 = 48_000 * 4 / 20
for _ in 0..<6 {
    var buffer: AudioQueueBufferRef?
    AudioQueueAllocateBuffer(inputQueue, bufferByteSize, &buffer)
    if let buffer {
        AudioQueueEnqueueBuffer(inputQueue, buffer, 0, nil)
    }
}

print("Monitoring \(targetName) to \(outputName). Press Ctrl-C to stop.")
AudioQueueStart(outputQueue, nil)
AudioQueueStart(inputQueue, nil)

if seconds > 0 {
    RunLoop.current.run(until: Date().addingTimeInterval(seconds))
} else {
    RunLoop.current.run()
}

AudioQueueStop(inputQueue, true)
AudioQueueStop(outputQueue, true)
AudioQueueDispose(inputQueue, true)
AudioQueueDispose(outputQueue, true)
