#### 安装

```sh
npm i video-alpha-player --save
```
#### 使用

```ts
import VideoPlayer from 'video-alpha-player';

const player = new VideoPlayer({
	el: document.getElementById('cvs')!,
	src: './assets/test.mp4',
	width: 720,
	height: 1280,
	loop: true,
	useBlob: false,
	autoplay: true,
	endCallBack: () => {
		// console.log('end');
	},
	updateCallBack: () => {
		// console.log('update');
	},
	errorCallBack: (err) => {
		// console.log('error');
	},
});

document.getElementById('play')!.onclick = () => {
	player.play();
};

document.getElementById('resume')!.onclick = () => {
	player.resume();
};

document.getElementById('pause')!.onclick = () => {
	player.pause();
};
```