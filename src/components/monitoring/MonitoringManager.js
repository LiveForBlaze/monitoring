import Api from "components/Api";
import Recorder from "components/Recorder";
import { parseJsonSilently } from "components/Utils";

const MonitoringManager = {
  hub: null,
  recordingId: null,
  hasConnection: false,
  webmHeader: [26,69,223,163,159,66,134,129,1,66,247,129,1,66,242,129,4,66,243,129,8,66,130,132,119,101,98,109,66,135,129,4,66,133,129,2,24,83,128,103,1,255,255,255,255,255,255,255,21,73,169,102,153,42,215,177,131,15,66,64,77,128,134,67,104,114,111,109,101,87,65,134,67,104,114,111,109,101,22,84,174,107,191,174,189,215,129,1,115,197,135,152,7,40,131,63,85,230,131,129,2,134,134,65,95,79,80,85,83,99,162,147,79,112,117,115,72,101,97,100,1,1,0,0,128,187,0,0,0,0,0,225,141,181,132,71,59,128,0,159,129,1,98,100,129,32],
  webmInitialCluster: [31,67,182,117,1,255,255,255,255,255,255,255,231,129,0],

  init() {
    if (!this.recordingId) {
      this.recordingId = this.generateGuid();
    }

    if (!this.hub) {
      Api.getSignalrConnection().then((connection) => {
        this.hub = connection.monitoringHub;

        this.hub.client.onAudioRequest = (connectionId) => {
          this.sendAudio(connectionId);
        };

        connection.hub.reconnected(() => {
          console.log("[MONITORING]", "reconnected");
          this.hasConnection = true;
        });

        connection.hub.disconnected(() => {
          console.log("[MONITORING]", "disconnected");
          this.hasConnection = false;

          setTimeout(() => {
            console.log("[MONITORING]", "reconnecting");

            connection.hub.start({withCredentials: false}).done(() => {
              console.log("[MONITORING]", "connected again");
              this.hasConnection = true;
            });
          }, 5000);
        });

        connection.hub.start({withCredentials: false, waitForPageLoad: false}).done(() => {
          console.log("[MONITORING]", "connected");
          this.hasConnection = true;
        });
      });
    }

    return this;
  },

  update(userId, data, monitoringId) {
    if (!this.hasConnection)
      return;

    const jsonData = JSON.stringify(data);
    this.hub.server.update(userId, monitoringId || this.recordingId, jsonData);
  },

  sendAudio(connectionId) {
    if (!this.hasConnection || !Recorder.chunks.length)
      return;

    this.getAudioChunk().then((audioBlob) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        this.hub.server.sendAudio(connectionId, this.recordingId, e.target.result);
      };
      reader.readAsDataURL(audioBlob);
    });
  },

  getAudioChunk() {
    return new Promise((resolve, reject) => {
      if (Recorder.chunks.length === 1) {
        resolve(Recorder.chunks[0]);
      } else {
        const lastChunk = Recorder.chunks[Recorder.chunks.length - 1],
              preLastChunk =  Recorder.chunks[Recorder.chunks.length - 2];

        this.getNextWebmChunkType(preLastChunk).then((nextChunkType) => {
          let chunkHeader;

          if (nextChunkType === "cluster") {
            chunkHeader = this.webmHeader.concat([0x1f]);
          } else {
            chunkHeader = this.webmHeader.concat(this.webmInitialCluster, [0xa3]);
          }

          resolve(new Blob([new Uint8Array(chunkHeader), lastChunk], {type: "audio/webm"}));
        });
      }
    });
  },

  generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  },

  getRoomDataStorageKey(userId) {
    return `room-details-${userId}`;
  },

  getRoomDetailsData(userId) {
    const storageKey = this.getRoomDataStorageKey(userId),
          dataStr = localStorage.getItem(storageKey),
          data = parseJsonSilently(dataStr);
    return data || {};
  },

  setRoomDetailsData(userId, data) {
    const storageKey = this.getRoomDataStorageKey(userId),
          dataStr = JSON.stringify(data);
    localStorage.setItem(storageKey, dataStr);
  },

  getNextWebmChunkType(prevChunk) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = (e) => {
        const buffer = e.target.result,
              bufferView = new Uint8Array(buffer, buffer.byteLength - 1),
              lastByte = bufferView[0];

        if (lastByte === 0xa3) {
          resolve("block");
        } else if (lastByte === 0x1f) {
          resolve("cluster");
        } else {
          resolve();
        }
      };

      reader.readAsArrayBuffer(prevChunk);
    });
  }
};

export default MonitoringManager;
