// Initialize participant size
let participants = 0;

function setupParticipant({ isLocal, id, attributes }) {

  // Increments the value of participants by 1
  participants = participants + 1
  
  // It determines the appropriate group ID based on whether the participant is local or remote.
  const groupId = isLocal ? "local-media" : "remote-media";
  
  // It retrieves the group container element based on the determined group ID.
  const groupContainer = document.getElementById(groupId);

  // It generates a unique participant container ID based on whether the participant is local or remote and
  // creates a container element for the participant using the createContainer function.
  const participantContainerId = isLocal ? "local" : id;
  const participantContainer = createContainer(participantContainerId);

  // Create a new div element for the participant's video container and add the 'relative' class
  const participantVideoContainer = document.createElement("div");
  participantVideoContainer.classList.add("relative");

  // Creates a video element for the participant using the createVideoEl function and appends the video element to the participant's container element
  const videoEl = createVideoEl(participantContainerId);
  const overlayEl = createOverlayEl(attributes.username);

  // Appends the video element and overlay element to the participant video container,
  participantVideoContainer.append(videoEl, overlayEl);
  participantContainer.appendChild(participantVideoContainer);

  // Then appends the participant video container to the main participant container
  groupContainer.appendChild(participantContainer);

  return videoEl;
}

function teardownParticipant({ isLocal, id }) {
  participants = participants - 1;
  const groupId = isLocal ? "local-media" : "remote-media";
  const groupContainer = document.getElementById(groupId);
  const participantContainerId = isLocal ? "local" : id;

  // If the participant's container element exists, it is removed from the group container. If the element does not exist, the function exits without further action.
  const participantDiv = document.getElementById(
    participantContainerId + "-container"
  );
  if (!participantDiv) {
    return;
  }
  groupContainer.removeChild(participantDiv);
}

function createVideoEl(id) {
  const videoEl = document.createElement("video");
  videoEl.id = id;
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.srcObject = new MediaStream();
  return videoEl;
}

function createOverlayEl(username) {
    const overlayEl = document.createElement("div");
    overlayEl.classList.add("overlay-pill");
    overlayEl.innerText = username ? username : `user-${participants}`; 
    return overlayEl;
}

function createContainer(id) {
  const participantContainer = document.createElement("div");
  participantContainer.classList = "participant-container";
  participantContainer.id = id + "-container";

  return participantContainer;
}
