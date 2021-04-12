import React, {useState, useRef, useEffect} from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import './App.css';
// import ReactDOM from 'react-dom';

var client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
var localTracks = {
  videoTrack: null,
  audioTrack: null
};

export const options = {
  appId: process.env.REACT_APP_appId,
  token: null,
  uid: null
};

function App() {
  const [joined, setJoined] = useState(false);
  const channelRef = useRef("");
  const remoteRef = useRef("");
  const leaveRef = useRef("");
  const [uids, setUids] = useState([]);
  const [unpublishedUid, setUnpublishedUid] = useState("");

  useEffect(() => {
  }, [uids])

  useEffect(() => {
    unsubscribe(unpublishedUid);
  }, [unpublishedUid])

  const join = async (e) => {
    try {
      if (channelRef.current.value === "") {
      return console.log("Please Enter Channel Name");
      }
      setJoined(true);

      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);

      //여기서, 엑티브 스피커를..?
      // client.enableAudioVolumeIndicator();
      // client.on("volume-indicator", volumes => {
      //   volumes.forEach((volume, index) => {
      //     console.log(`${index} UID ${volume.uid} Level ${volume.level}`);
      //   });
      // })

      options.uid = await client.join(options.appId, channelRef.current.value, options.token || null);
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();      
      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      localTracks.videoTrack.play("local-player");

      await client.publish(Object.values(localTracks));
    }
    catch(err){
      console.error(err)
    }
  }

  function handleUserPublished(user, mediaType) {
    const id = user.uid;
    subscribe(user, mediaType);
  }
  
  const handleUserUnpublished = (user) => {
    const id = user.uid;
    setUnpublishedUid(user.uid);
  }

  const unsubscribe = async (uid) => {
    console.log('unsubscribe');
    console.log(uids);
    const index = uids.findIndex((uid) => uid === uid)
    if(index === -1){    
    }else{
      const copy = [...uids]
      const newUids = copy.splice(index, 1)
      setUids(copy.splice(index, 1))
    }
  }

  const subscribe = async (user, mediaType) => {
    const uid = user.uid;
    await client.subscribe(user, mediaType);
    console.log("subscribe success");
    if (mediaType === 'video') {
      
      if(uids.includes(uid)){
        //pass
      }else{
        setUids(uids => 
          [...uids, uid]  
        )
        user.videoTrack.play(`player-${uid}`);
      }
      // const PlayerContainer = React.createElement("div", {
      //   id: `player-${user.uid}`,
      //   className: "player",
      // });
      // ReactDOM.render(
      //   PlayerContainer,
      //   document.getElementById("remote-playerlist")
      // );

      // user.videoTrack.play(`player-${uid}`);
    }
    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  }

  const leave = async (e) => {
    Object.keys(localTracks).forEach(trackName => {
      var track = localTracks[trackName];
      if(track) {
        track.stop();
        track.close();
        localTracks[trackName] = undefined;
      }
    })
  
    await client.leave();    
    setJoined(false);
  }

  return (
    <>
      <div className="container">
        <input
          type="text"
          ref={channelRef}
          id="channel"
          placeholder="Enter Channel name"
        />
        <input
          type="submit"
          value="Join"
          onClick={join}
          disabled={joined ? true : false}
        />
        <input
          type="button"
          ref={leaveRef}
          value="Leave"
          onClick={leave}
          disabled={joined ? false : true}
        />
      </div>
      {joined ? (
        <>
          <div id="local-player" className="stream local-stream"></div>

          <div className="col">
            <div id="remote-playerlist" style={{width:400, height:400,}}>
            {
              uids.map(uid => <>
                <div className="player" id={`player-${uid}`}></div>
              </>)
            }
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}


export default App;
