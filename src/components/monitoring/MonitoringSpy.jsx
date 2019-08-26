import { PureComponent } from "react";
import PropTypes from "prop-types";

import MonitoringManager from "components/monitoring/MonitoringManager";
import VideoFetcher from "components/VideoFetcher";
import config from "config";

class MonitoringSpy extends PureComponent {
  static propTypes = {
    userId: PropTypes.string.isRequired,
    recordingState: PropTypes.string,
    savingState: PropTypes.string,
    name: PropTypes.string.isRequired,
    slidesTotal: PropTypes.number.isRequired,
    slidesLoaded: PropTypes.number.isRequired,
    currentSlide: PropTypes.number.isRequired,
    videoSizeTotal: PropTypes.number.isRequired,
    videoSizeLoaded: PropTypes.number.isRequired,
    contentId: PropTypes.string,
    slideVideoState: PropTypes.string,
    slideVideoTime: PropTypes.number,
    liveRoomId: PropTypes.string,
    streamState: PropTypes.string
  };

  componentDidMount() {
    MonitoringManager.init();
    this.roomData = MonitoringManager.getRoomDetailsData(this.props.userId);
    this.autoUpdate = setInterval(this.sendData, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.autoUpdate);
  }

  componentDidUpdate() {
    this.sendData();
    if (this.props.liveRoomId && this.props.recordingState === "recording") {
      const liveData = this.gatherLiveDataFromProps(this.props);
      MonitoringManager.update(config["liveUserId"], liveData, `live-rec-${liveData.roomId}`);
    }
  }

  sendData = () => {
    const data = this.gatherDataFromProps(this.props);
    MonitoringManager.update(this.props.userId, data);
  }

  gatherLiveDataFromProps(props) {
    const videos = VideoFetcher.getSlideVideos(props.currentSlide - 1) || [];

    return {
      currentSlide: props.currentSlide,
      contentId: props.contentId,
      slideVideos: videos,
      slideVideoState: props.slideVideoState,
      slideVideoTime: props.slideVideoTime,
      roomId: props.liveRoomId,
      type: "live"
    }
  }

  gatherDataFromProps(props) {
    const { slidesLoaded, slidesTotal, videoSizeLoaded, videoSizeTotal, streamState } = this.props,
          videoSizeTotalMB = (videoSizeTotal / 1024 / 1024).toFixed(1),
          videoSizeLoadedMB = (videoSizeLoaded / 1024 / 1024).toFixed(1);

    // TODO: refactor!!
    let state,
        isHidden = false;

    if (props.savingState) {
      state = props.savingState === "saved" ? "Finished" : props.savingState === "saving" ? "Saving" : "Error during upload";
      isHidden = props.savingState === "saved";
    } else if (props.recordingState) {
      state = "Recording";
    } else {
      if (slidesLoaded < slidesTotal && videoSizeLoaded < videoSizeTotal) {
        state = "Downloading";
      } else {
        state = "Ready to record";
      }
    }

    return {
      id: MonitoringManager.recordingId,
      name: props.name,
      hasFocus: document.hasFocus(),
      slidesProgress: `${slidesLoaded}/${slidesTotal}`,
      slidesCompleted: slidesLoaded === slidesTotal,
      videosProgress: `${videoSizeLoadedMB}/${videoSizeTotalMB} MB`,
      videosCompleted: videoSizeLoaded === videoSizeTotal,
      currentSlide: props.currentSlide,
      roomName: this.roomData.name,
      streamState,
      state,
      isHidden,
      updatedAt: Date.now(),
      type: "monitoring"
    };
  }

  render() {
    return null;
  }
};

export default MonitoringSpy;
