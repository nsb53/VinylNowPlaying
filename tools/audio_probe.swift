import AudioToolbox
import CoreAudio
import Foundation

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
    return status == noErr ? value as String : "(unavailable)"
}

func channelCount(_ objectID: AudioObjectID, scope: AudioObjectPropertyScope) -> Int {
    var address = propertyAddress(kAudioDevicePropertyStreamConfiguration, scope)
    var size: UInt32 = 0

    guard AudioObjectGetPropertyDataSize(objectID, &address, 0, nil, &size) == noErr, size > 0 else {
        return 0
    }

    let bufferList = UnsafeMutableRawPointer.allocate(byteCount: Int(size),
                                                      alignment: MemoryLayout<AudioBufferList>.alignment)
    defer { bufferList.deallocate() }

    guard AudioObjectGetPropertyData(objectID, &address, 0, nil, &size, bufferList) == noErr else {
        return 0
    }

    let audioBufferList = bufferList.bindMemory(to: AudioBufferList.self, capacity: 1)
    let buffers = UnsafeMutableAudioBufferListPointer(audioBufferList)
    return buffers.reduce(0) { $0 + Int($1.mNumberChannels) }
}

var address = propertyAddress(kAudioHardwarePropertyDevices)
var size: UInt32 = 0

guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size) == noErr else {
    fatalError("Unable to read CoreAudio device list size.")
}

let count = Int(size) / MemoryLayout<AudioObjectID>.size
var devices = Array(repeating: AudioObjectID(), count: count)

guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size, &devices) == noErr else {
    fatalError("Unable to read CoreAudio device list.")
}

for device in devices {
    let name = stringProperty(device, kAudioObjectPropertyName)
    let manufacturer = stringProperty(device, kAudioObjectPropertyManufacturer)
    let uid = stringProperty(device, kAudioDevicePropertyDeviceUID)
    let inputChannels = channelCount(device, scope: kAudioDevicePropertyScopeInput)
    let outputChannels = channelCount(device, scope: kAudioDevicePropertyScopeOutput)
    print("\(device): \(name) [\(manufacturer)] uid=\(uid) input=\(inputChannels) output=\(outputChannels)")
}
