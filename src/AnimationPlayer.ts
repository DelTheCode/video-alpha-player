export default class VideoPlayer {
	public gl: WebGLRenderingContext;
	public ctx: CanvasRenderingContext2D | null = null;
	public canvas: HTMLCanvasElement | null = null;
	public supportVideo: Boolean | undefined = undefined;

	private bound: { width: number; height: number; } | null = null;
	private _indicesLength: number = 0;
	private _texture: WebGLTexture | null = null;
	private _program: any;

	constructor(canvas: HTMLCanvasElement, bound: { width: number; height: number; }) {
		this.bound = bound;
		this.gl = canvas.getContext("webgl")!;
		if (!this.gl) {
			console.warn('your environment not support webgl 🥺');
			return;
		}
		const VSHADER_SOURCE = `
        attribute vec4 a_Position;
		    attribute vec2 a_uv;

        uniform mat4 u_Translation;

		    varying vec2 uv;
        void main(){   
           gl_Position = a_Position;
		       uv= a_uv;
        }
    `;

		const FSHADER_SOURCE = `
        precision mediump float;
        uniform sampler2D uSampler;
	    	varying vec2 uv;
        void main(){
          vec3 color = texture2D( uSampler, vec2(0.5 + uv.x/2.0, uv.y) ).rgb;
          float alpha = texture2D( uSampler, vec2(uv.x/2.0, uv.y) ).r;
          // gl_FragColor = vec4(color,alpha);
          gl_FragColor = vec4(color,1.0)*alpha;
        }
    `;
		this._initShaders(VSHADER_SOURCE, FSHADER_SOURCE);
		this._initVertexBuffers();
		this._initTextures();
	}
	private _initShaders(vshader: string, fshader: string) {
		const program = this._createProgram(vshader, fshader);
		if (!program) {
			console.log('Failed to create program');
			return false;
		}

		this.gl.useProgram(program);
		this._program = program;
		return true;
	}
	private _createProgram(vshader: string, fshader: string) {
		const { gl } = this;
		const vertexShader = this._loadShader(gl.VERTEX_SHADER, vshader);
		const fragmentShader = this._loadShader(gl.FRAGMENT_SHADER, fshader);
		if (!vertexShader || !fragmentShader) {
			return null;
		}

		// Create a program object
		const program = gl.createProgram();
		if (!program) {
			return null;
		}

		// Attach the shader objects
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);

		// Link the program object
		gl.linkProgram(program);

		// Check the result of linking
		const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (!linked) {
			const error = gl.getProgramInfoLog(program);
			console.log('Failed to link program: ' + error);
			gl.deleteProgram(program);
			gl.deleteShader(fragmentShader);
			gl.deleteShader(vertexShader);
			return null;
		}
		return program;
	}
	private _loadShader(type: number, source: string) {
		const { gl } = this;
		const shader = gl.createShader(type);
		if (shader == null) {
			console.log('unable to create shader');
			return null;
		}

		// Set the shader program
		gl.shaderSource(shader, source);

		// Compile the shader
		gl.compileShader(shader);

		// Check the result of compilation
		const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compiled) {
			var error = gl.getShaderInfoLog(shader);
			console.log('Failed to compile shader: ' + error);
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}
	private _initVertexBuffers() {
		const { gl } = this;
		const vertextList = new Float32Array([
			-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0
		]);
		const uvList = new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]);
		const indices = new Uint8Array([
			0,
			1,
			2,
			1,
			2,
			3
		]);
		this._indicesLength = indices.length;
		this._initArrayBuffer("a_Position", vertextList, 2, gl.FLOAT);
		this._initArrayBuffer("a_uv", uvList, 2, gl.FLOAT);
		const indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	}
	_initArrayBuffer(attribute: string, data: Float32Array, num: number, type: number) {
		// Create a buffer object
		const { gl } = this;
		const buffer = gl.createBuffer();
		if (!buffer) {
			console.log("Failed to create the buffer object");
			return false;
		}
		// Write date into the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		// Assign the buffer object to the attribute variable
		const a_attribute = gl.getAttribLocation(this._program, attribute);
		if (a_attribute < 0) {
			console.log("Failed to get the storage location of " + attribute);
			return false;
		}
		gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
		// Enable the assignment of the buffer object to the attribute variable
		gl.enableVertexAttribArray(a_attribute);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		return true;
	}
	private _initTextures() {
		const { gl } = this;
		this._texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);

		// Because video havs to be download over the internet
		// they might take a moment until it's ready so
		// put a single pixel in the texture so we can
		// use it immediately.
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 0, 0]); // opaque blue
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			width,
			height,
			border,
			srcFormat,
			srcType,
			pixel
		);

		// Turn off mips and set  wrapping to clamp to edge so it
		// will work regardless of the dimensions of the video.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	}
	public updateTexture(dom: HTMLVideoElement) {
		// const _el = this._testSupportVideo(dom) || dom;
		const { gl } = this;
		const level = 0;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			dom
		);
	}

	
	/**
	 * 绘制视频数据到canvas
	 */
	public draw(dom: HTMLVideoElement) {
		this.updateTexture(dom);
		const { gl } = this;
		gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
		gl.clearDepth(1.0); // Clear everything
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things

		// Clear the canvas before we start drawing on it.

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Create a perspective matrix, a special matrix that is
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.

		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute

		// Set the shader uniforms

		// Specify the texture to map onto the faces.

		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);

		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, this._texture);

		// Tell the shader we bound the texture to texture unit 0
		gl.uniform1i(gl.getUniformLocation(this._program, "uSampler"), 0);

		gl.drawElements(gl.TRIANGLES, this._indicesLength, gl.UNSIGNED_BYTE, 0);
	}

	private _testSupportVideo(dom: HTMLVideoElement) {
		if (this.supportVideo) {
			return;
		}

		if (this.supportVideo === undefined) {
			this.gl.getError();

			this.gl.texImage2D(
				this.gl.TEXTURE_2D,
				0,
				this.gl.RGBA,
				this.gl.RGBA,
				this.gl.UNSIGNED_BYTE,
				dom
			);

			this.supportVideo = this.gl.getError() === 0;
		}

		if (!this.supportVideo && !this.ctx) {
			// this._createCanvasCtx();
			console.error('your environment not support webgl 🥺');
			return;
		}

		if (!this.supportVideo) {
			return this._drawCanvas(dom);
		}
	}

	
	/**
	 * 不支持webgl的情况下，降级Canvas2D
	 */
	private _createCanvasCtx() {
		if (!this.ctx) {
			this.canvas = document.createElement('canvas');
			this.canvas.width = this.bound!.width * 2;
			this.canvas.height = this.bound!.height;
			this.ctx = this.canvas.getContext('2d');
		}
	}

	/**
	 * 降级绘制视频数据到canvas
	 */
	private _drawCanvas(source: HTMLVideoElement) {
		this.ctx?.drawImage(source, this.bound!.width * 2, this.bound!.height);
		return this.canvas;
	}
}