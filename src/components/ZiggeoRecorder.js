/* globals ZiggeoApi */
import React from 'react';
import {
    reactCustomOptions, ziggeoRecorderAttributesPropTypes,
    ziggeoRecorderEmbeddingEventsPropTypes, screenRecorderOptions
} from '../constants';
import { string, bool, arrayOf, func  } from 'prop-types';

export default class ZiggeoRecorder extends React.Component {

    static recorder = null;
    static application = null;
    static applicationOptions = {};

	static propTypes = {
		apiKey:	string.isRequired,
		...ziggeoRecorderAttributesPropTypes,
		...ziggeoRecorderEmbeddingEventsPropTypes,
        ...screenRecorderOptions,
        ...reactCustomOptions
	};

	static defaultProps = {
		// Presentational parameters
		'width': 640,
		'height': 480,
		'picksnapshots': true,
		'countdown': 3,
		'snapshotmax': 15,
		'gallerysnapshots': 3,
		'theme': 'default',
		'themecolor': 'default',
		'primaryrecord': true,

		// Video management parameters
		'recordingwidth': 640,
		'recordingheight': 480,
		'framerate': 25,
		'videobitrate': 'auto',
		'audiobitrate': 'auto',
		'microphone-volume': 1,

		// Operational parameters
		'allowupload': true,
		'allowrecord':	true,
		'force-overwrite':	true,
		'allowcustomupload': true,
		'recordermode': true,

        // only react related options
        'preventReRenderOnUpdate': true,

        // screen configuration for Ziggeo extension
        "allowscreen": false,
        chrome_extension_id: "meoefjkcilgjlkibnjjlfdgphacbeglk",
        chrome_extension_install_link: "https://chrome.google.com/webstore/detail/meoefjkcilgjlkibnjjlfdgphacbeglk",
        opera_extension_id: "dnnolmnenehhgplebjhbcmfdbaabkepm",
        opera_extension_install_link: "https://addons.opera.com/en/extensions/details/3d46d4c36fefe97e76622c54b2eb6ea1d5406767",

		// Default events to no-op
		...Object.keys(ziggeoRecorderEmbeddingEventsPropTypes).reduce((defaults, event) => {
			defaults[event] = () => {};
			return defaults;
		}, {})
	};

	componentWillMount () {
        const { apiKey, allowscreen } = this.props;

        if(allowscreen) {
            this.options = this._applicationOptions;
        }

        this.application = ZiggeoApi.V2.Application.instanceByToken(apiKey, this.options);
    }

	componentDidMount () {
	    // Don't include Application initialization, will get this context issue
        this._buildRecorder();
	};

	// Trigger when state is changes
	shouldComponentUpdate (nextProps, nextState) {
        const { preventReRenderOnUpdate } = nextProps || true;
        return !preventReRenderOnUpdate;
    }

    componentWillUpdate (nextState) {
        this.props.onRef(undefined);
        this.recorder.destroy();
        const { apiKey, allowscreen } = this.props;

        if(allowscreen) {
            this.options = this._applicationOptions;
        }

        this.application = ZiggeoApi.V2.Application.instanceByToken(apiKey, this.options);
    }

    componentDidUpdate (prevState) {
        this._buildRecorder();
    }

	componentWillUnmount () {
        // Never call this.application.destroy() !!!
        // Will receive error 'Cannot read property 'urls' of undefined'
        this.props.onRef(undefined);

		this.recorder.destroy();
	};

	render () {
		return <div ref={e => { this.element = e ; }} {...this._elementProps} />;
	}

	_ziggeoEvents = Object.keys(ziggeoRecorderEmbeddingEventsPropTypes).reduce((memo, propName) => {
        const eventName = propName.replace(/([A-Z])/g, '_$1').toLowerCase().slice(3)
            .replace(/(recorder_|player_)/g, '');
        memo[eventName] = (...args) => {
            this.props[propName](...args)
        };
        return memo;
    }, {});

    get ziggeoAttributes () {
        return Object.keys(this.props).filter(k => ziggeoRecorderAttributesPropTypes[k]).reduce((props, k) => {
            props[k] = this.props[k];
            return props;
        }, {});
    }

    // Props which are not related to Ziggeo
    get _elementProps () {
        return Object.keys(this.props).filter(k => !this.constructor.propTypes[k]).reduce((props, k) => {
            props[k] = this.props[k];
            return props;
        }, {});
    }

    get _applicationOptions () {
        return Object.keys(this.props)
            .filter(k => screenRecorderOptions[k]).reduce((props, k) => {
                props[k] = this.props[k];
                return props;
            }, {});
    }

    _buildRecorder = () => {

        this.recorder = new ZiggeoApi.V2.Recorder({
            element: this.element,
            attrs: this.ziggeoAttributes
        });
        this.recorder.activate();

        Object.entries(this._ziggeoEvents).forEach(([event, func]) => {
            this.recorder.on(event, func);
        });

        this.props.onRef(this);
    };

    recorderInstance = () => this.recorder;

    // Delegate ziggeo attributes to the recorder
    get isRecording() { return this.recorder.view.isRecording() };
    get averageFrameRate() { return this.recorder.averageFrameRate() };
    get isFlash() { return this.recorder.isFlash() };
    get lightLevel() { return this.recorder.lightLevel() };
    get soundLevel() { return this.recorder.soundLevel() };
    get width() { return this.recorder.width() };
    get height() { return this.recorder.height() };
    get videoWidth() { return this.recorder.videoWidth() };
    get videoHeight() { return this.recorder.videoHeight() };

    // Delegate ziggeo methods to the recorder
    get = (...args) => this.recorder.get(...args);
    play = (...args) => this.recorder.play(...args);
    record = (...args) => this.recorder.record(...args);
    upload = (...args) => this.recorder.upload(...args);
    rerecord = (...args) => this.recorder.rerecord(...args);
    stop = (...args) => this.recorder.stop(...args);
    hidePopup = (...args) => this.recorder.hidePopup(...args);
    reset = (...args) => this.recorder.reset(...args);
    onStateChanged = (...args) => this.recorder.onStateChanged(...args);
}
