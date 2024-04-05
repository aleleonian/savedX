const { BrowserWindow, dialog  } = require('electron');

export const menuTemplate = [
  {
    "label": "File",
    "submenu": [
      {
        "label": "New",
        "accelerator": "CmdOrCtrl+N",
        "click": "Handle 'New' action"
      },
      {
        "label": "Open",
        "accelerator": "CmdOrCtrl+O",
        "click": "Handle 'Open' action"
      },
      { "type": "separator" },
      { "label": "Exit", "role": "quit" }
    ]
  },
  {
    "label": "Config",
    "submenu": [
      { "label": "Undo", "accelerator": "CmdOrCtrl+Z", "role": "undo" },
      { "label": "Redo", "accelerator": "Shift+CmdOrCtrl+Z", "role": "redo" },
      { "type": "separator" },
      { "label": "Cut", "accelerator": "CmdOrCtrl+X", "role": "cut" },
      { "label": "Copy", "accelerator": "CmdOrCtrl+C", "role": "copy" },
      { "label": "Paste", "accelerator": "CmdOrCtrl+V", "role": "paste" }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Dialog',
        click: () => {
          // Show a dialog when the "Open Dialog" menu item is clicked
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Dialog',
            message: 'This is a dialog!',
            buttons: ['OK']
          });
        }
      },
      { type: 'separator' },
      { role: 'quit' } // Add a Quit menu item
    ]
  },
  {
    label: 'Open Dialog',
    click: () => {
      // Show a dialog when the "Open Dialog" menu item is clicked
      const dialogWindow = new BrowserWindow({
        width: 600,
        height: 400,
        modal: true, // Make the dialog modal
        parent: mainWindow, // Set the main window as the parent
        webPreferences: {
          nodeIntegration: true // Enable Node.js integration in the dialog window
        }
      });

      // Load an HTML file or URL into the dialog window
      dialogWindow.loadURL('file://' + path.join(__dirname, 'dialog.html'));
    }
  },
]
