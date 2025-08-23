import React from "react";
import { CircularProgress } from "@mui/material";

const LoadingOverlay = ({ message = "Loading...", subMessage }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <CircularProgress />
        <p>{message}</p>
        {subMessage && <small>{subMessage}</small>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
