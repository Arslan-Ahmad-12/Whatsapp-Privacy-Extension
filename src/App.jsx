import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  IconButton,
  Grid,
  Popover,
  TextField,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const initialSettings = {
  allMessages: true,
  lastPreview: false,
  mediaPreview: true,
  mediaGallery: true,
  textInput: true,
  profilePictures: false,
  groupNames: false,
  noTransition: false,
  unblurOnHover: false,
  blurOnIdle: false,
};

function App() {
  const [globalToggle, setGlobalToggle] = useState(true);
  const [settings, setSettings] = useState(initialSettings);
  const [blurValues, setBlurValues] = useState({
    "blur amount": 8,
    "idle timeout": 10,
  });
  const defaultBlurValues = {
    "blur amount": 8,
    "idle timeout": 10,
  };

  const updateBlurValues = async (newValues) => {
    setBlurValues(newValues); // Update UI
    try {
      await sendMessageToExtension({
        type: "UPDATE_BLUR_VALUES",
        blurValues: newValues,
      });
      notifyContentScripts(); // Trigger content.js to reload values
    } catch (error) {
      console.error("Failed to update blur values:", error);
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const sendMessageToExtension = (message) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const notifyContentScripts = () => {
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "EXTENSION_UPDATED" });
      });
    });
  };

  // Load settings from storage
  useEffect(() => {
    chrome.storage.sync.get(
      ["globalToggle", "settings", "blurValues"],
      (result) => {
        if (result.globalToggle !== undefined) {
          setGlobalToggle(result.globalToggle);
        }
        if (result.settings) {
          setSettings(result.settings);
        }
        if (result.blurValues) {
          setBlurValues(result.blurValues);
          console.log(blurValues);
        }
      }
    );
  }, []);

  // Then modify your handlers:
  const handleGlobalToggle = async (e) => {
    const value = e.target.checked;
    setGlobalToggle(value);
    try {
      await sendMessageToExtension({ type: "TOGGLE_GLOBAL", value });
      notifyContentScripts(); // force content script to reapply
    } catch (error) {
      console.error("Failed to update extension:", error);
      setGlobalToggle(!value);
    }
  };

  const handleSettingChange = async (e) => {
    const newSettings = {
      ...settings,
      [e.target.name]: e.target.checked,
    };
    setSettings(newSettings);

    try {
      await sendMessageToExtension({
        type: "UPDATE_SETTINGS",
        settings: newSettings,
      });
      notifyContentScripts();
    } catch (error) {
      console.error("Failed to update settings:", error);
      // Revert UI if update fails
      setSettings((prev) => ({
        ...prev,
        [e.target.name]: !e.target.checked,
      }));
    }
  };

  const renderSettingRow = (label, key) => (
    <Grid
      container
      alignItems="center"
      justifyContent="space-between"
      sx={{ my: 1 }}
    >
      <Grid item display="flex" alignItems="center" gap={1}>
        <Typography>{label}</Typography>
      </Grid>
      <Grid item>
        <Switch
          name={key}
          checked={settings[key]}
          onChange={handleSettingChange}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: 320, p: 2, height: "550px" }}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <VisibilityOffIcon color="primary" />
        <Box>
          <Typography fontWeight="bold">Privacy Extension</Typography>
          <Typography variant="body2">For WhatsApp Web</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Grid container alignItems="center" justifyContent="space-between">
        <Typography fontWeight="bold">Toggle</Typography>
        <Switch checked={globalToggle} onChange={handleGlobalToggle} />
      </Grid>

      <Divider sx={{ my: 1 }} />
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography fontWeight="bold" sx={{ mb: 1 }}>
          Settings
        </Typography>
        <IconButton size="small" color="primary" onClick={handleSettingsClick}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 1,
          maxHeight: "calc(100vh - 270px)", // Adjust height based on your header + footer height
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#90caf9 transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#90caf9",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#42a5f5",
          },

          "&::-webkit-scrollbar-button:single-button": {
            display: "none",
            width: 0,
            height: 0,
            backgroundColor: "transparent",
          },
        }}
      >
        {renderSettingRow("All messages in chat", "allMessages")}
        {renderSettingRow("Last messages preview", "lastPreview")}
        {renderSettingRow("Media preview", "mediaPreview")}
        {renderSettingRow("Media gallery", "mediaGallery")}
        {renderSettingRow("Text input", "textInput")}
        {renderSettingRow("Profile pictures", "profilePictures")}
        {renderSettingRow("Group/Users names", "groupNames")}
        {renderSettingRow("No transition delay", "noTransition")}
        {renderSettingRow("Unblur all on app hover", "unblurOnHover")}
        {renderSettingRow("Blur WhatsApp on Idle", "blurOnIdle")}
      </Paper>

      <Typography
        variant="caption"
        display="block"
        sx={{ mt: 2, textAlign: "center", color: "gray" }}
      >
        v1.0.0 - Initial Release
        <br />
        Developed by Arslan
        <br />
        Powered by OptimaGeeks
      </Typography>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 1,
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 190,
            maxWidth: 230,
            backgroundColor: "#fff",
          },
        }}
      >
        {["Blur amount", "Idle timeout"].map((label, i) => {
          const key = label.toLowerCase();
          const isBlur = key === "blur amount";
          const unit = isBlur ? "px" : "s";

          return (
            <Box
              key={key}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={0.5}
              sx={{ mb: i < 1 ? 1 : 0 }}
            >
              <Typography
                variant="caption"
                sx={{ width: 70, whiteSpace: "nowrap", overflow: "hidden" }}
              >
                {label}
              </Typography>

              <IconButton
                size="small"
                color="error"
                sx={{ p: 0.3 }}
                onClick={() => {
                  const updated = {
                    ...blurValues,
                    [key]: defaultBlurValues[key],
                  };
                  updateBlurValues(updated);
                }}
              >
                <ReplayIcon fontSize="small" />
              </IconButton>

              <Box
                display="flex"
                alignItems="center"
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  px: 0.5,
                  height: 28,
                  backgroundColor: "#f5f5f5",
                }}
              >
                <TextField
                  value={blurValues[key]}
                  onChange={(e) =>
                    setBlurValues((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  size="small"
                  type="number"
                  variant="standard"
                  inputProps={{
                    min: 0,
                    style: {
                      padding: 0,
                      minWidth: 36,
                      maxWidth: 36,
                      textAlign: "center",
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-root": { fontSize: "12px" },
                    "& .MuiInput-underline:before, & .MuiInput-underline:after":
                      {
                        borderBottom: "none",
                      },
                    "& .MuiInputBase-input": { p: 0 },
                  }}
                />
                <Typography variant="caption" sx={{ ml: 0.3 }}>
                  {unit}
                </Typography>
              </Box>

              <IconButton
                size="small"
                color="success"
                sx={{ p: 0.3 }}
                onClick={() => updateBlurValues(blurValues)}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Popover>
    </Box>
  );
}

export default App;
