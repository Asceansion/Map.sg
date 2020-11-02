import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Card, CardContent, Slide, Dialog, AppBar, Toolbar, Typography, Button, IconButton, Paper, List } from '@material-ui/core';
import {
    Close as CloseIcon, PlayArrow as PlayArrowIcon, Delete as DeleteIcon,
    BookmarkBorder as BookmarkBorderIcon, Bookmark as BookmarkIcon
} from '@material-ui/icons';
import { toggleHistoryView } from '../../Action/HomeActions';
import { runHistory, toggleBookmark } from '../../Action/NavigationActions';
import { deleteHistory } from '../../Action/FirebaseAction';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
    navFab: {
        top: 'auto',
        right: 35,
        bottom: 150,
        position: 'fixed',
    },
    searchFab: {
        top: 'auto',
        right: 35,
        bottom: 80,
        position: 'fixed',
    },
    slidePanel: {
        width: '50%',
        left: 10,
        bottom: 45,
        position: 'fixed',
    },
    appBar: {
        position: 'relative',
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    dialogTitle: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    form: {
        padding: 20
    },
    root: {
        display: 'flex',
        margin: 5
    },
    content: {
        flex: '1 0 auto',
    },
    controls: {
        alignItems: 'right',
        paddingLeft: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    playIcon: {
        height: 38,
        width: 38,
    },
    details: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    centerText: {
        textAlign: 'center'
    },
}));

const mapStateToProps = (state) => {
    const appState = {
        historyView: state.HomeReducer.historyView,
        history: state.FirebaseReducer.history,
        user: state.FirebaseReducer.user,
    };
    return appState;
};

function mapDispatchToProps(dispatch) {
    return {
        toggleHistoryView: () => dispatch(toggleHistoryView()),
        runHistory: routeInformation => dispatch(runHistory(routeInformation)),
        deleteHistory: historyId => dispatch(deleteHistory(historyId)),
        toggleBookmark: bookmark => dispatch(toggleBookmark(bookmark)),
    }
}

function HistoryView(props) {
    const classes = useStyles();

    function startFromHistoryHandler(dataRow) {
        props.runHistory(
            {
                routeInformation: JSON.parse(dataRow.route_information)[0],
                startLocation: dataRow.start_location[0],
                endLocation: dataRow.end_location[0],
                routeName: dataRow.route_name,
            });
        props.toggleHistoryView()
    }

    function deleteHistoryHandler(historyId) {
        props.deleteHistory({ userId: props.user.uid, historyId: historyId });
    }

    function bookmarkHandler(routeId, bookmark) {
        props.toggleBookmark({ userId: props.user.uid, routeId: routeId, bookmark: bookmark });
    }

    return (
        <Dialog
            fullScreen
            open={props.historyView}
            TransitionComponent={Transition}
            keepMounted
            onClose={() => props.toggleHistoryView()}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
        >
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => props.toggleHistoryView()} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        History
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container>
                {(props.history && props.history.length > 0) && props.history.map(dataRow => (
                    <Paper key={dataRow[0]} style={{ maxHeight: 200, overflow: 'auto' }}>
                        <Card className={classes.root}>
                            <div className={classes.details}>
                                <CardContent className={classes.content}>
                                    <Typography component="p" variant="body1">
                                        From: {dataRow[1].route_name[0]}
                                    </Typography>
                                    <Typography component="p" variant="body1">
                                        To: {dataRow[1].route_name[1]}
                                    </Typography>
                                    <Typography component="p" variant="body1">
                                        Date: {dataRow[1].date_added}
                                    </Typography>
                                </CardContent>
                            </div>
                            <div className={classes.controls}>
                                {dataRow[1].bookmark == false && (
                                    <IconButton onClick={() => bookmarkHandler(dataRow[0], true)} aria-label="play/pause">
                                        <BookmarkBorderIcon />
                                    </IconButton>
                                )}
                                {dataRow[1].bookmark == true && (
                                    <IconButton onClick={() => bookmarkHandler(dataRow[0], false)} aria-label="play/pause">
                                        <BookmarkIcon />
                                    </IconButton>
                                )}
                                <IconButton onClick={() => startFromHistoryHandler(dataRow[1])} aria-label="play/pause">
                                    <PlayArrowIcon className={classes.playIcon} />
                                </IconButton>
                                <IconButton onClick={() => deleteHistoryHandler(dataRow[0])}>
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </Card>
                    </Paper>
                ))}
            </Container>
        </Dialog>
    )
}


const History = connect(
    mapStateToProps,
    mapDispatchToProps,
)(HistoryView);


export default History;