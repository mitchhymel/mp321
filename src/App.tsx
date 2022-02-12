import React, { useRef, useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import logo from './logo.svg';
import './App.css';


const ffmpeg = createFFmpeg({
  log: true,
  corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js"
});

function App() {

  const [message, setMessage] = useState('Progress will show here');

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const imageRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<string>('');

  const [audioSrc, setAudioSrc] = useState('');
  const [videoSrc, setVideoSrc] = useState('');


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
  const outputListTextName = 'combined.txt';

  const combineFilesIntoOneMp3 = async () => {
    setMessage('Loading ffmpeg-core.js');
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    setMessage('Starting combinining mp3s into one...');


    var commandstr = '';
    var inputs:string[] =[];
    for (var i=0; i < files.length; i++) {
      var file = files[i];
      ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      commandstr += `-i ${file.name} `
      inputs.push('-i');
      inputs.push(file.name);
    }
    inputs.push('-filter_complex');
    inputs.push(`amix=inputs=${files.length}`);
    inputs.push(outputFileName);
    await ffmpeg.run(...inputs);
    //await ffmpeg.run(commandstr, '-filter_complex', `amix=inputs=${files.length}`, outputFileName);
    
    // const inputPaths = [];
    // for (var i=0; i < files.length; i++) {
    //   var file = files[i];
    //   ffmpeg.FS('writeFile', file.name, await fetchFile(file));
    //   inputPaths.push(`file ${file.name}`);
    // }
    // var str = inputPaths.join('\n');
    // console.log(str);
    // var data = new TextEncoder().encode(str);
    // ffmpeg.FS('writeFile', outputListTextName, data);

    // await ffmpeg.run('-f', outputListTextName, '-filter_complex', `amix=inputs=${files.length}`, outputFileName);
  
  }

  const onCombineClick = async () => {
    await combineFilesIntoOneMp3();
    const data = ffmpeg.FS('readFile', outputFileName);
    setAudioSrc(URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' })));
  }

  const onCombineIntoVideoClick = async () => {

    await combineFilesIntoOneMp3();

    var outputVideoFileName = 'outputVideo.mp4';
    var imageFileName = 'tmp.png';
    ffmpeg.FS('writeFile', imageFileName, await fetchFile(image));

    var inputs: string[] = ['-r', '1', '-loop', '1', '-y', '-i', imageFileName, '-i', outputFileName, '-c:a', 'copy', '-r', '1', '-vcodec', 'libx264', '-shortest', outputVideoFileName];
    await ffmpeg.run(...inputs);
    
    const data = ffmpeg.FS('readFile', 'outputVideo.mp4');
    setVideoSrc(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));
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
    <div className="App">
      <h2>{message}</h2>
      <p/>
      <br/>

      <input multiple type='file' id='file' ref={fileRef} style={{display: 'none'}} onChange={onChangeFile}/>
      <button onClick={onAddFileClick}>Add File(s)</button>

      {files.length > 0 && <p>Files Loaded</p>}
      {files.length > 0 && files.map(file => 
        <div key={file.name}>
          <p>{file.name}</p>
          <audio src={URL.createObjectURL(file)} controls/>
        </div>
      )}

      <br/>

      <button onClick={onCombineClick}>Combine into one mp3</button>
      <br/>
      {audioSrc && 
        <div>
          <p>Combined</p>
          <audio src={audioSrc} controls></audio>
        </div>
      }
      <br/>

      <br/>
      <input accept='image/*' type='file' id='image' ref={imageRef} style={{display: 'none'}} onChange={onImageChange}/>
      <button onClick={onSelectImageClick}>Select Image</button>
      <br/>
      {image && <img src={image} width='400'  />}

      <br/>
      <button onClick={onCombineIntoVideoClick}>Combine into a video</button>
      {videoSrc &&
        <div>
          <video src={videoSrc} controls width='400'></video>
        </div>
      }

    </div>
  );
}

export default App;
