export interface VideoOptions {
	useBlob?: boolean,
	width: number,
	height: number,
	loop?: boolean
	autoplay?: boolean,
	endCallBack?: () => any,
	updateCallBack?: () => void,
	errorCallBack?: () => void
	onError?: (err?: ErrorEvent) => void,
}

export default class VideoPlayer {
	public videoScript: HTMLVideoElement;
	public ready: boolean = false; // 视频是否就绪

	private opts: VideoOptions;
	private playing: boolean = false; // 视频正在播放中
	private timeupdate: boolean = false;


	constructor(src: string, opts: VideoOptions) {
		this.opts = opts || <VideoOptions>{};

		// 创建视频播放器
		this.videoScript = document.createElement("video");
		this.videoScript.width = opts.width * 2; // 宽度是画布的双倍
		this.videoScript.height = opts.height;
		this.videoScript.controls = false;
		this.videoScript.playsInline = true;
		this.videoScript.loop = opts.loop || false;
		this.videoScript.autoplay = false;
		this.videoScript.muted = true;
		this.videoScript.crossOrigin = "Anonymous";
		// @ts-ignore
		this.videoScript["x5-video-player-type"] = "h5";

		// 是否使用blob方式加载视频
		if (opts.useBlob && typeof fetch !== 'undefined') {
			this.loadVideoBlob(src)
				.then((res: string) => this.videoScript.src = res)
				.catch((err: any) => {
					console.error('video error', err);
					if (opts.onError) opts.onError(err);
				})
		} else {
			this.videoScript.src = src;
		}

		// 监听视频事件
		this.videoScript.addEventListener('canplay', this.onReadyPlay.bind(this));
		this.videoScript.addEventListener("playing", this.playingEventHandler.bind(this));
		this.videoScript.addEventListener("timeupdate", this.timeupdateEventHandler.bind(this));
		this.videoScript.addEventListener("ended", this.onEndedPlay.bind(this));
		this.videoScript.addEventListener('error', this.onErrorPlay.bind(this));
	}

	private onReadyPlay() {
		//
	}

	private onErrorPlay(err: ErrorEvent) {
		if (this.opts.onError) this.opts.onError(err);
	}

	private onEndedPlay() {
		if (this.opts.endCallBack) this.opts.endCallBack();
	}

	private playingEventHandler() {
		this.playing = true;
		this.checkReady();
	}

	private timeupdateEventHandler() {
		this.timeupdate = true;
		this.checkReady();
	}

	/**
	 * 检查视频是否就绪
	 */
	private checkReady() {
		if (this.playing && this.timeupdate) {
			this.ready = true;
		}
	}

	private loadVideoBlob(url: string) {
		return fetch(url).then(res => res.blob()).then(res => {
			return URL.createObjectURL(res);
		});
	}

	/**
	 * 开始视频播放
	 */
	public play() {
		this.videoScript.currentTime = 0;
		this.videoScript.play();
	}

	/**
	* 恢复视频播放
	*/
	public resume() {
		this.videoScript.play();
	}

	/**
	 * 暂停视频播放
	 */
	public pause() {
		this.videoScript.pause();
	}

	/**
	 * 销毁视频播放器
	 */
	public dispose() {
		this.pause();
		this.videoScript.removeEventListener('canplay', this.onReadyPlay.bind(this));
		this.videoScript.removeEventListener("playing", this.playingEventHandler.bind(this));
		this.videoScript.removeEventListener("timeupdate", this.timeupdateEventHandler.bind(this));
		this.videoScript.removeEventListener("ended", this.onEndedPlay.bind(this));
		this.videoScript.removeEventListener('error', this.onErrorPlay.bind(this));
		this.videoScript.remove();
	}
}