/*
Zoom Video SDK Sample
*/
let ZoomVideo
let client
let stream
let videoDecode
let videoEncode
let audioDecode
let audioEncode
let sessionId = null
let rtmsClient = null

////////////////////////////////////////////////////////////////////////
//
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('user_name').value = "User" + Math.floor(Math.random() * 100)
  document.getElementById('join-button').addEventListener('click', joinSession)
  document.getElementById('leave-button').addEventListener('click', leaveSession)
  document.getElementById('rtms-start-button').addEventListener('click', startRTMS)
  document.getElementById('rtms-stop-button').addEventListener('click', stopRTMS)
  console.log('DOMContentLoaded')
})

////////////////////////////////////////////////////////////////////////
// TO BEGIN
// CREATE VIDEO SDK CLIENT
// INITIALIZE VIDEO SDK CLEINT
// ADD LISTENER THEN JOIN

async function joinSession() {

  //CREATE VIDEO SDK CLIENT
  ZoomVideo = window.WebVideoSDK.default
  client = ZoomVideo.createClient()

  //INIT VSDK CLIENT
  client.init('en-US', 'CDN')

  //LISTEN FOR CONNECTION STATUS
  client.on('connection-change', (payload) => {
   console.log("Connection Change: ", payload)
   if(payload.state == "Closed"){
     location.reload()
   }
  })

  //MEDIA ENCODER DECODER STATE
  client.on('media-sdk-change', (payload) => {
      console.log("media-sdk-change: " + JSON.stringify(payload))
      if (payload.type === 'video' && payload.result === 'success') {
        if (payload.action === 'encode') {
          videoEncode = true
        } else if (payload.action === 'decode') {
          videoDecode = true
        }
      }
      if (payload.type === 'audio' && payload.result === 'success') {
        if (payload.action === 'encode') {
          audioEncode = true
        } else if (payload.action === 'decode') {
          audioDecode = true
        }
      }
  })

  //LISTEN TO FAR END VIDEO STATUS
  client.on('peer-video-state-change', (payload) => {
   console.log("peer-video-state-change: " + JSON.stringify(payload))
   if (payload.action === 'Start') {
     if(videoDecode){
       toggleFarVideo(stream, payload.userId, true)
     }else{
       console.log("wait untill videoDecode gets enabled")
       waitForVideoDecoder(500, payload.userId)
     }
   } else if (payload.action === 'Stop') {
      toggleFarVideo(stream, payload.userId, false)
   }
  })

  // added listener for dimension change
  client.on('video-dimension-change', payload => {
    console.log(payload)
  })

  //GET PARAMETERS AND JOIN VSDK SESSION
  let topic = document.getElementById('session_topic').value
  let userName = document.getElementById('user_name').value
  let password = document.getElementById('session_pwd').value
  let role = document.querySelector('input[name="joinRole"]:checked').value

  let token = await getSignature(topic, role, password)
  console.log("topic: "+topic+", token: "+token+", userName: "+userName+", password: "+password);

  client.join(topic, token, userName, password).then(() => {
    stream = client.getMediaStream();
    var n = client.getCurrentUserInfo();
    var m = client.getSessionInfo();
    sessionId = m.sessionId;
    console.log("getCurrentUserInfo: ", n);
    console.log("get Session ID: ", sessionId);
    console.log("Connection Success");
    cameraStartStop(); //automatically unmute camera when join
    audioStart(); //automatically start audio
    rtmsClient = client.getRealTimeMediaStreamsClient()
    console.log("[RTMS] rtmsClient:", rtmsClient)
    console.log("[RTMS] isSupportRealTimeMediaStreams:", rtmsClient.isSupportRealTimeMediaStreams())
    console.log("[RTMS] canStartRealTimeMediaStreams:", rtmsClient.canStartRealTimeMediaStreams())
    console.log("[RTMS] getRealTimeMediaStreamsStatus:", rtmsClient.getRealTimeMediaStreamsStatus())
    console.log("[RTMS] getCurrentUserInfo:", client.getCurrentUserInfo())
    updateRTMSButtons();
  }).catch((error) => {
    console.log(error)
  })

}

//LEAVE OR END SESSION
function leaveSession() {
  var n = client.getCurrentUserInfo()
  console.log("isHost: " + n.isHost)
  if(n.isHost){
    client.leave(true)
  }else{
    client.leave()
  }
}


//AUDIO START
async function audioStart() {
  try{
    await stream.startAudio()
    console.log(Date(Date.now()) + " audioStart")
  } catch (e){
    console.log(e)
  }
}

//LOCAL CAMERA START STOP
async function cameraStartStop() {

  let isVideoOn = await stream.isCapturingVideo()
  console.log(Date(Date.now())+"cameraStartStop isCapturingVideo: " + isVideoOn)
  let localVideoTrack = ZoomVideo.createLocalVideoTrack() // USED FOR RENDER SELF_VIDEO WITH VIDEO TAG
  var n = client.getCurrentUserInfo()
  console.log("getCurrentUserInfo: ", n)

  var selfId = n.userId
  console.log("selfId: ", selfId)

  if(!isVideoOn){
    toggleSelfVideo(stream,localVideoTrack, selfId, true)
  }else{
    toggleSelfVideo(stream,localVideoTrack, selfId, false)
  }

}


//VIDEO TAG MODE TOGGLE NEAR END VIDEO ON VIDEO TAG
const toggleSelfVideo = async (mediaStream,localVideoTrack, userId, isVideoOn) => {
    let selfVideo = document.getElementById('self-video-videotag')
    if (isVideoOn) {
        console.log(Date(Date.now())+"toggleSelfVideo start")
        await localVideoTrack.start(selfVideo)
        await stream.startVideo({videoElement: selfVideo,hd:true})
        isVideoOn = true
        console.log(Date(Date.now())+"Near end video rendering started.")
    } else {
        console.log("toggleSelfVideo stop")
        await localVideoTrack.stop()
        await stream.stopVideo()
        isVideoOn = false
    }
}

//TOGGLE FAR END VIDEO ON CANVAS
const toggleFarVideo = async (mediaStream, userId, isVideoOn) => {
  var FAR_VIDEO_CANVAS = document.getElementById('far-video-canvas')
    if (isVideoOn) {
        await mediaStream.renderVideo(
            FAR_VIDEO_CANVAS,
            userId,
            1280,  // Size Width
            720,  // Size Height
            0,      // Starting point x (Vertical : 横)
            0,     // Starting point y (Horizon : 縦)
            3       // Video Quality 0:90p, 1:180p, 2:360p, 3:720p
        )
        console.log(Date(Date.now())+`${userId} video rendered.`)
    } else {
        await mediaStream.stopRenderVideo(FAR_VIDEO_CANVAS, userId)
        await mediaStream.clearVideoCanvas(FAR_VIDEO_CANVAS, userId)
        console.log(Date(Date.now())+`${userId} video removed.`)
    }
}


////////////////////////////////////////////////////////////////////////
// WAIT FOR DECODERS

//WAIT FOR VIDEO DECODER
async function waitForVideoDecoder(ms, userid){
let len = 10
 for (let i = 0; i < len; i++) {
  await sleep(ms)
  console.log("waiting for video decoder: " + i)
   if(videoDecode){
    toggleFarVideo(stream, userid, true)
     break
   }
 }
}

//SLEEP(WAIT)
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

////////////////////////////////////////////////////////////////////////
// RTMS START / STOP

// RealTimeMediaStreamsStatus enum: 0 = Initial/Idle, 1 = Started, 3 = Stopped
const RTMS_STATUS_STARTED = 1
const RTMS_STATUS_STOPPED = 3

async function startRTMS() {
  setRTMSStatus('Starting RTMS...')
  try {
    await rtmsClient.startRealTimeMediaStreams()
    await waitForRTMSStatus(RTMS_STATUS_STARTED, 10000)
  } catch (e) {
    setRTMSStatus('RTMS start error: ' + JSON.stringify(e))
    console.log('startRTMS error:', e)
  }
}

async function stopRTMS() {
  setRTMSStatus('Stopping RTMS...')
  try {
    await rtmsClient.stopRealTimeMediaStreams()
    await waitForRTMSStatus(RTMS_STATUS_STOPPED, 10000)
  } catch (e) {
    setRTMSStatus('RTMS stop error: ' + JSON.stringify(e))
    console.log('stopRTMS error:', e)
  }
}

async function waitForRTMSStatus(expectedStatus, timeoutMs) {
  const interval = 500
  const maxTries = timeoutMs / interval
  for (let i = 0; i < maxTries; i++) {
    var status = rtmsClient.getRealTimeMediaStreamsStatus()
    console.log('[RTMS] waitForRTMSStatus - current:', status, 'expected:', expectedStatus)
    if (status === expectedStatus) {
      var label = expectedStatus === RTMS_STATUS_STARTED ? 'Started' : 'Stopped'
      setRTMSStatus('RTMS ' + label + '.')
      updateRTMSButtons()
      return
    }
    await sleep(interval)
  }
  setRTMSStatus('RTMS status timeout (current: ' + rtmsClient.getRealTimeMediaStreamsStatus() + ')')
  updateRTMSButtons()
}

function updateRTMSButtons() {
  var startBtn = document.getElementById('rtms-start-button')
  var stopBtn = document.getElementById('rtms-stop-button')
  if (rtmsClient) {
    var canStart = rtmsClient.canStartRealTimeMediaStreams()
    var status = rtmsClient.getRealTimeMediaStreamsStatus()
    var isRunning = status === RTMS_STATUS_STARTED
    console.log("[RTMS] updateRTMSButtons - canStart:", canStart, "status:", status, "isRunning:", isRunning)
    startBtn.disabled = !canStart || isRunning
    stopBtn.disabled = !isRunning
  } else {
    console.log("[RTMS] updateRTMSButtons - rtmsClient is null")
    startBtn.disabled = true
    stopBtn.disabled = true
  }
}

function setRTMSStatus(msg) {
  console.log('RTMS: ' + msg)
  document.getElementById('rtms-status').textContent = msg
}

////////////////////////////////////////////////////////////////////////
//　GET SIGNATURE FOR VSDK FOR WEB
function getSignature(topic, role, password) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest()
        console.log("location.hostname: " + location.hostname)
        xhr.open('POST', './', true)
        xhr.setRequestHeader('content-type', 'application/json')
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                const obj = JSON.parse(xhr.response)
                console.log("getSignature: " + xhr.response)
                resolve(obj.signature)
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                })
            }
        }
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            })
        }
        const body = JSON.parse('{}')
        body["topic"] = topic
        body["role"] = parseInt(role)
        body["password"] = password
        console.log("sending JSON request with this body: "+body)
        xhr.send(JSON.stringify(body))
    })
}
