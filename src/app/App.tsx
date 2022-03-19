import React, { useEffect, useRef, useState } from 'react';
import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';
import styled from 'styled-components';

import FileList from '../components/FileList';
import AudioWavePlayer from '../components/AudioWavePlayer';

const StyledApp = styled.div`
  text-align: center;
`;

const StyledCode = styled.div`
  white-space:  nowrap;
  background-color: #d7d7d7;
  overflow: auto;
  width: 100%;
  height: 500;
  text-align: left;
`;


var ffmpeg:FFmpeg;

interface Progress {
  ratio: number;
}

interface Log {
  date: Date;
  type: string;
  message: string;
}

function App() {

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const imageRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<string>('');

  const [audioSrc, setAudioSrc] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [combinedFile, setCombinedFile] = useState<File | null>(null);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    ffmpeg = createFFmpeg({
      log: true,
      corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
      progress: (p) => setProgress(p),
      logger: (l) => {
        logs.unshift({
          date: new Date(),
          message: l.message,
          type: l.type
        });
        setLogs(logs);
      }
    });
  }, [])

  const onAddFileClick = () => {
    if (fileRef.current !== null) {
      fileRef.current.click();
    }
  }

  const onChangeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();

    var newFiles: File[] = [];
    if (event.currentTarget === null || event.currentTarget.files === null) {
      console.error('Current Target was null');
      return;
    }

    for (var i = 0; i < event.currentTarget.files.length; i++) {
      var file = event.currentTarget.files[i];
      if (!file.name.endsWith('.mp3')) {
        console.error(`Selected file is not an mp3: ${file}`);
        continue;
      }

      newFiles.push(file);
    }

    newFiles = newFiles.concat(files);
    setFiles(newFiles);
  }

  const outputFileName = 'combined.mp3';

  const combineFilesIntoOneMp3 = async () => {

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }


    var inputs:string[] =[];
    for (var i=0; i < files.length; i++) {
      var file = files[i];
      ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      inputs.push('-i');
      inputs.push(file.name);
    }
    inputs.push('-filter_complex');
    inputs.push(`amix=inputs=${files.length}`);
    inputs.push(outputFileName);
    await ffmpeg.run(...inputs);
    return outputFileName;
  }

  const onCombineClick = async () => {
    setShowProgress(true);
    await combineFilesIntoOneMp3();
    const data = ffmpeg.FS('readFile', outputFileName);
    const blob = new Blob([data.buffer], { type: 'audio/mp3' });
    const file = new File([blob], 'combined.mp3');
    //setAudioSrc(URL.createObjectURL(file));
    setCombinedFile(file);

    setShowProgress(false);
  }

  const onDownloadClick = async (file: File) => {
    var url = URL.createObjectURL(file);
    var link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  }

  const onCombineIntoVideoClick = async () => {
    setShowProgress(true);

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    var inputFileName: string = outputFileName;
    if (files.length > 1) {
      inputFileName = await combineFilesIntoOneMp3();
    }
    else {
      var file = files[0];
      inputFileName = file.name;
      ffmpeg.FS('writeFile',file.name, await fetchFile(file));
    }

    
    try {
      var outputVideoFileName = 'outputVideo.mp4';
      var imageFileName = 'tmp.png';
      ffmpeg.FS('writeFile', imageFileName, await fetchFile(image));
  
      var inputs: string[] = ['-r', '1', '-loop', '1', '-y', '-i', imageFileName, '-i', inputFileName, '-c:a', 'copy', '-r', '1', '-vcodec', 'libx264', '-shortest', outputVideoFileName];
      await ffmpeg.run(...inputs);
      
      const data = ffmpeg.FS('readFile', outputVideoFileName);
      setVideoSrc(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));  
    } catch (exception) {
      logs.unshift({
        date: new Date(),
        message: (exception as Error).message,
        type: 'exception'
      });
      setLogs(logs);
    }
    setShowProgress(false);
  }

  const onSelectImageClick = () => {
    if (imageRef.current !== null) {
      imageRef.current.click();
    }
  }

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.currentTarget === null || event.currentTarget.files === null) {
      console.error('image was null');
      return;
    }

    setImage(URL.createObjectURL(event.currentTarget.files[0]));
  }


  return (
    <StyledApp>

      <br/>

      <input multiple type='file' id='file' ref={fileRef} style={{display: 'none'}} onChange={onChangeFile}/>
      <button disabled={showProgress} onClick={onAddFileClick}>Add File(s)</button>

      <FileList
        files={files}
        onRemoveFile={(file) => {
          var newFiles = files.filter((f) => f.name !== file.name);
          setFiles(newFiles);
        }}
      />

      <br/>


      <button disabled={files.length < 2 || showProgress} onClick={onCombineClick}>Combine into one mp3</button>
      
      <br/>
      {combinedFile && <AudioWavePlayer file={combinedFile!} index={-1} onDownloadFile={onDownloadClick}/>}
      <br/>

      <br/>
      <input accept='image/*' type='file' id='image' ref={imageRef} style={{display: 'none'}} onChange={onImageChange}/>
      <button disabled={showProgress} onClick={onSelectImageClick}>Select Image</button>
      <br/>
      {image && <img alt='selectedImage' src={image} width='400'  />}

      <br/>
      <button disabled={files.length == 0 || showProgress || image === ''} onClick={onCombineIntoVideoClick}>Combine all tracks into a video with static image</button>
      {videoSrc &&
        <div>
          <video src={videoSrc} controls width='400'>
            <a href={videoSrc} download>Download video</a>
          </video>
        </div>
      }

      <br />

      {showProgress && progress &&
        <progress value={progress.ratio} max={1}/>
      }

      <p>Ffmpeg output below</p>
      <StyledCode>
        {logs.map((l, index) => {
          var message = `${l.date.toLocaleTimeString()} ${l.type}: ${l.message}`;
          var key=index;
          return (
            <code key={key}>{message}<br/></code>
          )
        })}
      </StyledCode>

    </StyledApp>
  );
}

export default App;
