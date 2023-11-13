const {
  Stage,
  LocalStageStream,
  SubscribeType,
  StageEvents,
  ConnectionState,
  StreamType,
} = IVSBroadcastClient;

let cameraButton = document.getElementById("camera-control");
let micButton = document.getElementById("mic-control");
let joinButton = document.getElementById("join-button");
let leaveButton = document.getElementById("leave-button");

let controls = document.getElementById("local-controls");
let videoDevicesList = document.getElementById("video-devices");
let audioDevicesList = document.getElementById("audio-devices");

let videoContainer = document.getElementById("video-container");
let gridContainer = document.getElementById("grid-container");

// Stage management
let stage;
let joining = false;
let connected = false;
let localCamera;
let localMic;
let cameraStageStream;
let micStageStream;
let remoteStreams = [];

// Initialize participant size
let participantSize = 0;

const init = async () => {
  // Line ensures that the device selection is initialized before proceeding further.
  await initializeDeviceSelect();

  // Toggles the mute status of the camera stream when clicked. The button text is updated accordingly to either "Show Camera" or "Hide Camera" depending on the mute status.
  cameraButton.addEventListener("click", () => {
    const isMuted = !cameraStageStream.isMuted;
    cameraStageStream.setMuted(isMuted);
    cameraButton.innerText = isMuted ? "Show Camera" : "Hide Camera";
  });

  // Toggles the mute status of the microphone stream when clicked. The button text is updated accordingly to either "Unmute Mic" or "Mute Mic" depending on the mute status.
  micButton.addEventListener("click", () => {
    const isMuted = !micStageStream.isMuted;
    micStageStream.setMuted(isMuted);
    micButton.innerText = isMuted ? "Unmute Mic" : "Mute Mic";
  });

  // Triggers the joinStage function when clicked, allowing the user to join the current stage.
  joinButton.addEventListener("click", () => {
    joinStage();
  });

  // Triggers the leaveStage function when clicked, allowing the user to leave the current stage.
  leaveButton.addEventListener("click", () => {
    leaveStage();
  });
};

const joinStage = async () => {
  // It checks if the user is already connected or in the process of joining. If so, it stops the execution.
  if (connected || joining) {
    return;
  }
  joining = true;

  //The function retrieves the token entered in the HTML document. If no token is provided, it alerts the user to enter a participant token and stops the execution.
  const token = document.getElementById("token").value;
  if (!token) {
    window.alert("Please enter a participant token");
    joining = false;
    return;
  }

  // It retrieves the local camera and microphone media based on the selected devices.
  localCamera = await getCamera(videoDevicesList.value);
  localMic = await getMic(audioDevicesList.value);

  // Creates LocalStageStream instances for the camera and microphone.
  cameraStageStream = new LocalStageStream(localCamera.getVideoTracks()[0]);
  micStageStream = new LocalStageStream(localMic.getAudioTracks()[0]);

  // It sets up a strategy for the stage, defining which streams to publish and which participantSize to subscribe to.
  const strategy = {
    stageStreamsToPublish() {
      return [cameraStageStream, micStageStream];
    },
    shouldPublishParticipant() {
      return true;
    },
    shouldSubscribeToParticipant() {
      return SubscribeType.AUDIO_VIDEO;
    },
  };

  // Creates a new stage instance
  stage = new Stage(token, strategy);

  // Other available events:
  // https://aws.github.io/amazon-ivs-web-broadcast/docs/sdk-guides/stages#events

  // Event listeners are set for various stage events, such as connection state changes, participant joining, participant stream additions, and participant leaving.
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    connected = state === ConnectionState.CONNECTED;

    if (connected) {
      joining = false;
      controls.classList.remove("hidden");
      videoContainer.classList.remove("hidden");

      // Mutes the microphone stage stream and updates the inner text of the mic button to "Unmute Mic"
      micStageStream.setMuted(true);
      micButton.innerText = "Unmute Mic";
      
    } else {
      controls.classList.add("hidden");
      videoContainer.classList.add("hidden");
    }
  });

  stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, (participant) => {
    console.log("Participant Joined:", participant);

    // Increments the participantSize variable by 1
    participantSize = participantSize + 1;
  });

  stage.on(
    StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
    (participant, streams) => {
      console.log("Participant Media Added: ", participant, streams);

      // Updates the CSS class of the gridContainer element to reflect the number of participants indicated by the participantSize variable.
      gridContainer.classList = "grid " + "grid-" + participantSize;

      let streamsToDisplay = streams;

      if (participant.isLocal) {
        // Ensure to exclude local audio streams, otherwise echo will occur
        streamsToDisplay = streams.filter(
          (stream) => stream.streamType === StreamType.VIDEO
        );
      }

      const videoEl = setupParticipant(participant);
      streamsToDisplay.forEach((stream) =>
        videoEl.srcObject.addTrack(stream.mediaStreamTrack)
      );
    }
  );

  stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (participant) => {
    console.log("Participant Left: ", participant);

    // Decrements the participantSize variable by 1 and updates the CSS class of the gridContainer element to reflect the number of participants indicated by the participantSize variable.
    participantSize = participantSize - 1;
    gridContainer.classList = "grid " + "grid-" + participantSize;
    teardownParticipant(participant);
  });

  // Tries to join the stage, and if an error occurs during the process, it handles the error and resets the joining and connected flags accordingly.
  try {
    await stage.join();
  } catch (err) {
    joining = false;
    connected = false;
    console.error(err.message);
  }
};

const leaveStage = async () => {
  // Indicating that the current user is leaving the stage.
  stage.leave();

  // Reflect that the user is no longer in the process of joining and is disconnected from the stage.
  joining = false;
  connected = false;

  cameraButton.innerText = "Hide Camera";
  micButton.innerText = "Mute Mic";
  controls.classList.add("hidden");
};

init();
