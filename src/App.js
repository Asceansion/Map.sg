// import node modules
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { createMuiTheme, ThemeProvider, CssBaseline } from '@material-ui/core';

// import components
import HomePage from './Components/Home';
import SignInPage from './Components/Authentication/SignIn';
import SignUpPage from './Components/Authentication/SignUp';

// import constants
import * as ROUTES from './Constants/routes';


/* *
   * Main entry point of the applications.
   *
   * @author Koh Tong Liang
   * @version 1.0
   * @since 19/10/2020
   * */
function App() {
/* *
   * create a theme to allow usage of dark or light theme depending on user's device preference
   */
  const theme = React.useMemo(
    () => createMuiTheme({
      palette: {
        type: true ? 'dark' : 'light',
      },
    }),
  );

 /* *
    * Different pages are organized into routes for ease of navigation for the users.
    * Router component contains route which are linked to the individual pages packaged
    * as components. Navigation component is loaded here as navigation will remain fixed
    * throughout all pages.
    */
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Route exact path={ROUTES.HOME} component={HomePage} />
        <Route path={ROUTES.SIGN_IN} component={SignInPage} />
        <Route path={ROUTES.SIGN_UP} component={SignUpPage} />
      </Router>
      <CssBaseline />
    </ThemeProvider>
  );
}

export default App;
