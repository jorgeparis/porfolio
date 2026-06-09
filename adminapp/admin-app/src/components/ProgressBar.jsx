import React from 'react';

function ProgressBar({ progress, status }) {
  return (
    <>
      <div className="progress-wrap">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="status">
        {status}
      </div>
    </>
  );
}

export default ProgressBar;