import React from 'react';
import { Link } from 'react-router-dom';

import { AppBar, Toolbar, Typography, IconButton, Drawer, List,
Divider, ListItem, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem,
SwipeableDrawer } from '@material-ui/core';
import { Menu as MenuIcon, AccountCircle, Home as HomeIcon } from '@material-ui/icons';

import * as VALUES from '../../Constants/values';
import * as ROUTES from '../../Constants/routes';
import { AuthUserContext } from '../Session';
import SignOutButton from '../Authentication/SignOut';

const useStyles = makeStyles((theme) => ({
    appBar: {
      top: 'auto',
      bottom: 0,
    },
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
    list: {
        width: 250,
    },
    fullList: {
        width: 'auto',
    },
  }));

const Navigation = () => { 
    const classes = useStyles();
    const [state, setState] = React.useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });
    const [auth, setAuth] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleChange = (event) => {
        setAuth(event.target.checked);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const toggleDrawer = (anchor, open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setState({ ...state, [anchor]: open });
    };

    return (
        <div>
            <AuthUserContext.Consumer>
                {authUser => <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton onClick={toggleDrawer('left', true)} edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
                        <MenuIcon />
                        </IconButton>
                        <div>
                            <SwipeableDrawer onOpen={toggleDrawer('left', true)} anchor={'left'} 
                            open={state['left']} onClose={toggleDrawer('left', false)}>
                            <div
                                className={classes.list}
                                role="presentation"
                                onClick={toggleDrawer('left', false)}
                                onKeyDown={toggleDrawer('left', false)}
                            >
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <HomeIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <Link to={ROUTES.HOME}>Home</Link>
                                        </ListItemText>
                                    </ListItem>
                                    {authUser && (
                                        <ListItem>
                                            <ListItemIcon>
                                                <HomeIcon />
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Link>Test</Link>
                                            </ListItemText>
                                        </ListItem>
                                    )}
                                </List>
                                <Divider />
                            </div>
                            </SwipeableDrawer>
                        </div>
                        <Typography variant="h6" className={classes.title}>
                            {VALUES.APPNAME}
                        </Typography>
                        
                        {authUser && (
                             <div>
                                <IconButton
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                                >
                                    <AccountCircle />
                                </IconButton>
                                <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={open}
                                onClose={handleClose}
                                >
                                    <MenuItem onClick={handleClose}>Profile</MenuItem>
                                    <MenuItem onClick={handleClose}>My account</MenuItem>
                                    <MenuItem>
                                        <SignOutButton/>
                                    </MenuItem>
                                </Menu>
                            </div>
                        )}
                        {!authUser && <Link to={ROUTES.SIGN_IN}>Sign In</Link>}
                    </Toolbar>
                </AppBar>}
            </AuthUserContext.Consumer>
        </div>
      );
}

export default Navigation;