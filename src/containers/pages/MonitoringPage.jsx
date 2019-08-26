import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import "styles/pages/monitoring_page.scss";

import AppLayout from "components/AppLayout";
import Api from "components/Api";
import MonitoringPanelRedesigned from "components/monitoring/MonitoringPanelRedesigned";
import MonitoringPanel from "components/monitoring/MonitoringPanel";

class MonitoringPage extends PureComponent {
  static propTypes = {
    userId: PropTypes.string
  };

  constructor(...args) {
    super(...args);
    this.state = {scriptLoaded: false, testUI: true};
  }

  componentDidMount() {
    Api.getSignalrConnection().then((connection) => {
      this.signalrConnection = connection;
      this.setState({scriptLoaded: true});
    });
  }

  handleToggleUI = () => {
    this.setState({testUI: !this.state.testUI})
  }

  render() {
    const [{scriptLoaded, testUI}, {userId}] = [this.state, this.props];
    return (
      <AppLayout pageClass="monitoring-page">
        <div className="content-box">
          <h1>Monitoring</h1>
          { !userId && <div><em>waiting user login data..</em></div> }
          { !scriptLoaded && <div><em>loading signalr scripts..</em></div> }
          <div className="monitoring-page-button-container">
            < button className="monitoring-page-button" onClick={this.handleToggleUI}>{testUI ? "Old" : "New"} UI</button>
          </div>
          { userId && scriptLoaded ? (testUI ? <MonitoringPanelRedesigned userId={userId} connection={this.signalrConnection} /> : <MonitoringPanel userId={userId} connection={this.signalrConnection} />) : null }
        </div>
      </AppLayout>
    );
  }
};

const mapStateToProps = ({currentUser}) => ({
  userId: currentUser.id
});

export default connect(
  mapStateToProps
)(MonitoringPage);
