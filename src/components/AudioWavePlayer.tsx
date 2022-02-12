import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import WaveSurfer from 'wavesurfer.js';

import { MdOutlinePlayArrow, MdOutlinePause, MdClose, MdOutlineDownload } from 'react-icons/md';

const Title = styled.p`
  position: absolute;
  top: 0px;
  left: 60px;
`

const WaveContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  background-color: #e3e8ff;
  border-radius: 35px;
  padding-top: 30px;
`;

const Container = styled.div`
  position: relative;
`


const Wave = styled.div`
  width: 100%;
  height: 90px;
`;

const PlayButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: #EFEFEF;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  &:hover {
    background: #DDD;
  }
`;


const RemoveButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: #EFEFEF;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  padding-bottom: 3px;  
  &:hover {
    background: #DDD;
  }
`;

interface AudioWavePlayerProps {
  file: File,
  index: number,
  onRemoveFile?: (file: File) => void,
  onDownloadFile?: (file: File) => void,
}

function AudioWavePlayer(props: AudioWavePlayerProps) {
  const { file, index, onRemoveFile, onDownloadFile } = props;
  
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      return;
    }

    var ws = WaveSurfer.create({
      container: `#waveForm${index}`,
      waveColor: 'grey',
      progressColor: 'blue',
      responsive: true,
      barWidth: 2,
      cursorWidth: 1,
      height: 80,
      backend: 'WebAudio',
    });

    ws.on('ready', function() {
      setLoaded(true);
      setWaveSurfer(ws);
    })

    ws.load(URL.createObjectURL(file))
  }, [file, setWaveSurfer, index]);

  const onPlayPause = () => {
    if (waveSurfer === null) {
      return;
    }

    setPlaying(!playing);
    waveSurfer.playPause();
  }

  return (
    <Container>
      <WaveContainer>
        <PlayButton onClick={onPlayPause}>{!playing ? <MdOutlinePlayArrow size={20}/> : <MdOutlinePause size={20}/>}</PlayButton>
        <Wave id={`waveForm${index}`} />
        {onRemoveFile && <RemoveButton onClick={() => onRemoveFile!(file)}><MdClose size={20}/></RemoveButton>}
        {onDownloadFile && <RemoveButton onClick={() => onDownloadFile!(file)}><MdOutlineDownload size={20}/></RemoveButton>}
      </WaveContainer>
      <Title>{file.name}</Title>
    </Container>
  );
}

export default AudioWavePlayer;