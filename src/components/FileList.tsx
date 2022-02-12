import React from 'react';

interface FileListProps {
  files: File[],
  onRemoveFile: (file: File) => void,
}

function FileList(props: FileListProps) {
  const { files, onRemoveFile } = props;

  return (
    <div>
      {files.length > 0 && files.map(file => 
        <div key={file.name}>
          <p>{file.name}</p>
          <audio src={URL.createObjectURL(file)} controls/>
          <button onClick={() => onRemoveFile(file)}>Remove this file</button>
        </div>
      )}
    </div>
  );
}

export default FileList;