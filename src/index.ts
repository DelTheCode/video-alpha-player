import VideoPlayer from "./VideoPlayer";
import AnimationPlayer from "./AnimationPlayer";
import type { VideoOptions } from "./VideoPlayer";

type AlphaVideoOptions = VideoOptions & {
  el: HTMLCanvasElement | HTMLElement;
  src: string;
}

export default class AlphaVideoPlayer {
  public video: VideoPlayer;
  public player: AnimationPlayer;

  private rafId = -1;
  private opts: AlphaVideoOptions;
  private canvas: HTMLCanvasElement | null = null;

  constructor(opts: AlphaVideoOptions) {
    this.opts = opts || <AlphaVideoOptions>{};
    const { el, src } = opts;
    // 检查canvas画布
    let canvas: HTMLCanvasElement;
    if (el instanceof HTMLCanvasElement) {
      canvas = el;
    } else {
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      el.appendChild(canvas);
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = opts.width * dpr;
    canvas.height = opts.height * dpr;
    this.canvas = canvas;

    // 初始化视频播放器和动画播放器
    this.video = new VideoPlayer(src, {
      ...opts,
      endCallBack: () => {
        this.stopRender(); // 停止渲染递归
        if (opts.endCallBack) opts.endCallBack();
      }
    });
    this.player = new AnimationPlayer(canvas, {
      width: opts.width,
      height: opts.height
    });

    // 如果是自动播放则直接播放
    if (opts.autoplay) this.play();
  }

  private render() {
    if (this.video.ready) {
      this.player.draw(this.video.videoScript);
    }
    this.rafId = requestAnimationFrame(this.render.bind(this));
  };

  private stopRender() {
    if (this.rafId !== -1) {
      cancelAnimationFrame(this.rafId);
      this.rafId = -1;
    }
  }

  /**
   * 播放动效
   */
  public play() {
    this.stopRender();
    this.video.play();
    this.render();
  };

  /**
   * 恢复播放
   */
  public resume() {
    this.stopRender();
    this.video.resume();
    this.render();
  };


  /**
   * 暂停动效
   */
  public pause() {
    this.stopRender();
    this.video.pause();
  };

  /**
   * 销毁动效
   */
  public dispose() {
    this.stopRender();
    this.video.dispose();
    if (!(this.opts.el instanceof HTMLCanvasElement) && this.canvas && this.canvas.remove) {
      this.canvas.remove();
    }
  };
}
