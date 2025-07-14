// Camera debugging utility
// Run this in browser console to test camera permissions and access

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugCamera = async () => {
  console.log('🔍 Camera Debug Utility');
  console.log('========================');
  
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('❌ getUserMedia is not supported in this browser');
    return;
  }
  
  console.log('✅ getUserMedia is supported');
  
  try {
    // Check permissions
    const permission = await navigator.permissions.query({ name: 'camera' });
    console.log('📹 Camera permission status:', permission.state);
    
    // List available devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('📱 Available video devices:', videoDevices.length);
    videoDevices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.label || 'Unknown Camera'} (${device.deviceId})`);
    });
    
    // Test camera access
    console.log('🎥 Testing camera access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });
    
    console.log('✅ Camera access successful!');
    console.log('📊 Stream info:', {
      active: stream.active,
      id: stream.id,
      tracks: stream.getTracks().length
    });
    
    // Test video tracks
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track, index) => {
      console.log(`🎬 Video track ${index + 1}:`, {
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings()
      });
    });
    
    // Create a test video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = '300px';
    video.style.height = '225px';
    video.style.border = '2px solid green';
    video.style.position = 'fixed';
    video.style.top = '10px';
    video.style.right = '10px';
    video.style.zIndex = '9999';
    
    document.body.appendChild(video);
    
    console.log('📺 Test video element added to page (top-right corner)');
    console.log('⏱️  Video will auto-remove in 10 seconds');
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(video);
      console.log('🧹 Test video removed and stream stopped');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Camera test failed:', error);
    console.log('💡 Common issues:');
    console.log('  - Camera permission denied');
    console.log('  - Camera in use by another application');
    console.log('  - Browser security restrictions (HTTPS required)');
    console.log('  - No camera devices available');
  }
};

// Auto-run the debug
console.log('📹 Camera debug utility loaded. Run debugCamera() to test camera access.');
// debugCamera();
