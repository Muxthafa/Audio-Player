
import { MutableRefObject, useEffect, useRef, useState } from "react";
import styles from "./AudioPlayer.module.scss";
import { storeAudioFile, retrieveAudioFile } from '../utils/indexDb';

const AUDIO_PROGRESS_INDICATOR_MULTIPLIER = 10000;

const transformSecondsToTimeString = (seconds: number | undefined) => {
  if (!seconds) return "0:00";

  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(1, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const AudioPlayer = ({sourceLink}:{sourceLink: string}) => {
  const audioRef: MutableRefObject<HTMLAudioElement | null> = useRef(null);

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDurationString, setAudioDurationString] = useState(
    transformSecondsToTimeString(0)
  );
  const [audioCurrentTimeString, setAudioCurrentTimeString] = useState(
    transformSecondsToTimeString(0)
  );

  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
      const fetchAudio = async () => {
        let audioBlob = await retrieveAudioFile(sourceLink);
  
        if (!audioBlob) {
          const response = await fetch(sourceLink);
          audioBlob = await response.blob();
          console.log('audioBlob first time',audioBlob);
          
          await storeAudioFile(sourceLink, audioBlob);
        }else{
          console.log('audioBlob second time',audioBlob);
        }
  
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };
  
      fetchAudio();
  
      return () => {
        // Cleanup the object URL when the component unmounts
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      };
    }, [sourceLink]);

  useEffect(() => {
      if (audioRef.current) audioRef.current?.play();
  
      return () => {
        audioRef.current?.pause();
      };
    }, [audioUrl]);


  const audioReadyHandler = () => {
    setAudioCurrentTime(audioRef.current?.currentTime!);

    // Sometime actual audio duration is more than the recorder duration due to delay in recorder stopping the audio record
    if (
      isFinite(audioRef.current?.duration!) &&
      audioRef.current?.duration!
    ) {
      const updatedDuration = Math.ceil(audioRef.current?.duration!);
      setAudioDurationString(transformSecondsToTimeString(updatedDuration));
    }
  };

  const audioTimeUpdateHandler = () => {
    setAudioCurrentTime(audioRef.current?.currentTime!);
    setAudioCurrentTimeString(
      transformSecondsToTimeString(audioRef.current?.currentTime)
    );
  };


  const audioSeekHandler = (seekTime: number) => {
    if (audioRef.current?.currentTime) {
      audioRef.current.currentTime = seekTime;
    }
  };

  return (
    <div className={styles.audioPlayer}>
      <div>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={audioReadyHandler}
          onTimeUpdate={audioTimeUpdateHandler}
        />
        <input
          type="range"
          aria-hidden="true"
          className={styles.seek}
          onChange={(event) => {
            audioSeekHandler(
              Math.floor(
                +event.target.value / AUDIO_PROGRESS_INDICATOR_MULTIPLIER
              )
            );
          }}
          value={Math.floor(
            audioCurrentTime * AUDIO_PROGRESS_INDICATOR_MULTIPLIER
          )}
          min="0"
          max={
            Math.floor(audioRef.current?.duration!) *
              AUDIO_PROGRESS_INDICATOR_MULTIPLIER ||
            AUDIO_PROGRESS_INDICATOR_MULTIPLIER
          }
        />
        <div className={styles.sleekSlider}>
          <span className="body-3">{audioCurrentTimeString}</span>
          <span className="body-3">- {audioDurationString}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
