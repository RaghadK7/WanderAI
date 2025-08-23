import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

const OptionCard = ({ title, description, icon: Icon, selected, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        border: selected ? "2px solid #1976d2" : "1px solid #ccc",
        backgroundColor: selected ? "#e3f2fd" : "#fff",
        transition: "0.3s",
      }}
    >
      <CardActionArea>
        <CardContent sx={{ textAlign: "center" }}>
          {Icon && <Icon fontSize="large" color={selected ? "primary" : "action"} />}
          <Typography variant="h6" gutterBottom>{title}</Typography>
          <Typography variant="body2" color="textSecondary">{description}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default OptionCard;
