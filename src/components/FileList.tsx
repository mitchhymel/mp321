import React, { useEffect } from 'react';
import AudioWavePlayer from './AudioWavePlayer';

interface FileListProps {
  files: File[],
  onRemoveFile: (file: File) => void,
}

function FileList(props: FileListProps) {
  const { files, onRemoveFile } = props;

  return (
    <div>
      {files.length > 0 && files.map((file, index) => 
        <div key={file.name} style={{paddingTop: '5px'}}>
          <AudioWavePlayer file={file} index={index} onRemoveFile={() => onRemoveFile(file)} />
        </div>
      )}
    </div>
  );
}

export default FileList;