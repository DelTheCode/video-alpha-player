import VideoPlayer from '../src';

const player = new VideoPlayer(
	{
		el: document.getElementById('cvs')!,
		src: './assets/test.mp4',
		width: 720,
		height: 1280,
		loop: true,
		useBlob: false,
		autoplay: true,
		endCallBack: () => {},
		updateCallBack: () => {
			// console.log('update');
		},
		errorCallBack: () => {},
	}
);

document.getElementById('play')!.onclick = () => {
	player.play();
};

document.getElementById('resume')!.onclick = () => {
	player.resume();
};

document.getElementById('pause')!.onclick = () => {
	player.pause();
};