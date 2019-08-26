import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import HomePage from 'components/pages/HomePage';
import PricingPage from 'components/pages/PricingPage';
import UserPage from 'containers/pages/UserPage';
import EmbedRecordPage from 'containers/pages/EmbedRecordPage';
import RecordingPage from 'containers/pages/RecordingPage';
import RecordEditorPage from 'containers/pages/RecordEditorPage';
import RecordsBrowser from "components/pages/RecordsBrowser";
import Slideshow from "components/pages/Slideshow";
import MonitoringPage from "containers/pages/MonitoringPage";
import LivePage from "components/pages/LivePage";
import AvmaPage from "components/pages/avma/AvmaPage";
import AbaPage from "components/pages/aba/AbaPage";

import PCCSpm from "components/pages/pcc-spm/App";
import IABCSpm from "components/pages/iabc-spm/App";
import ABASpm from "components/pages/aba-spm/App";
import ADHASpm from "components/pages/adha-spm/App";
import NAASpm from "components/pages/naa-spm/App";
import TIADASpm from "components/pages/tiada-spm/App";
import NTCASpm from "components/pages/ntca-spm/App";
import ISHRMSpm from "components/pages/ishrm-spm/App";
import LAGCOESpm from "components/pages/lagcoe-spm/App";
import SCMSpm from "components/pages/scm-spm/App";

export default class Root extends React.Component {
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  render() {
    return (
      <Provider store={this.props.store}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route exact path="/pricing" component={PricingPage} />
            <Route exact path="/user/:id" component={UserPage} />
            <Route exact path="/(v|view)/:alias" component={EmbedRecordPage} />
            <Route exact path="/record/:id" component={RecordingPage} />
            <Route exact path="/records/:id/edit" component={RecordEditorPage} />
            <Route exact path="/records_browser" component={RecordsBrowser} />
            <Route exact path="/slideshow" component={Slideshow} />
            <Route exact path="/monitoring" component={MonitoringPage} />
            <Route exact path="/debug/live" component={LivePage} />
            <Route exact path="/avma/live" component={AvmaPage} />
            <Route exact path="/aba/live" component={AbaPage} />
            <Route path="/popcultureclassroom/presentations" component={PCCSpm} />
            <Route path="/iabc/presentations" component={IABCSpm} />
            <Route path="/bookweb/presentations" component={ABASpm} />
            <Route path="/adha2019/presentations" component={ADHASpm} />
            <Route path="/auctioneers/presentations" component={NAASpm} />
            <Route path="/tiadaannualconference/presentations" component={TIADASpm} />
            <Route path="/ntca/presentations" component={NTCASpm} />
            <Route path="/indianashrm/presentations" component={ISHRMSpm} />
            <Route path="/lagcoe/presentations" component={LAGCOESpm} />
            <Route path="/scm-congress/presentations" component={SCMSpm} />
          </Switch>
        </BrowserRouter>
      </Provider>
    );
  }
}
