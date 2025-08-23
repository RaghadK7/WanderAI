import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const AuthDialog = ({ open, onClose, onSignIn }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Sign In Required</DialogTitle>
      <DialogContent>
        Please sign in to generate your travel plan and save trips.
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={onSignIn} variant="contained" color="primary">Sign In</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthDialog;
