var Filters = (function() {
	
	function normalize(array) {
		var sum = array.reduce( function (a, b) { return a+b; } );
		for(var i=0; i<array.length; ++i) 
			array[i] /= sum ;
	}
	
	function convolute(pixels, weights, opaque, norm) {
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side/2);
		var src = pixels.data;
		var sw = pixels.width;
		var sh = pixels.height;
		// pad output by the convolution matrix
		var w = sw;
		var h = sh;
		var dst = pixels.data;
		// go through the destination image pixels
		var alphaFac = opaque ? 1 : 0;
		if(norm) 
			normalize(weights);
		for (var y = 0; y < h; y++) {
			for (var x = 0; x < w; x++) {
				var sy = y;
				var sx = x;
				var dstOff = (y*w+x)*4;
				// calculate the weighed sum of the source image pixels that
				// fall under the convolution matrix
				var r = 0, g = 0, b = 0, a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = sy + cy ;
						var scx = sx + cx ;
						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
							var srcOff = (scy*sw + scx)*4;
							var wt = weights[cy*side + cx];
							r += src[srcOff] * wt;
							g += src[srcOff + 1] * wt;
							b += src[srcOff + 2] * wt;
							a += src[srcOff + 3] * wt;
						}
					}
				}
				dst[dstOff] = r;
				dst[dstOff + 1] = g;
				dst[dstOff + 2] = b;
				dst[dstOff + 3] = a + alphaFac*(255-a);
			}	
		}
		return pixels;
	}
	
	function convoluteFloat32(pixels, weights, opaque) {
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side/2);

        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;

        var w = sw;
        var h = sh;
        var output = {
           width: w, height: h, data: new Float32Array(w*h*4)
        };
        var dst = output.data;

        //var alphaFac = opaque ? 1 : 0;

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
				var sy = y;
				var sx = x;
				var dstOff = (y*w + x)*4;
				var r = 0, g = 0, b = 0, a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
						var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
						var srcOff = (scy*sw + scx)*4;
						var wt = weights[cy*side + cx];
						r += src[srcOff] * wt;
						g += src[srcOff + 1] * wt;
						b += src[srcOff + 2] * wt;
						//a += src[srcOff + 3] * wt;
					}
				}
				dst[dstOff] = r;
				dst[dstOff + 1] = g;
				dst[dstOff + 2] = b;
				//dst[dstOff + 3] = a + alphaFac*(255-a);
            }
        }
        return output.data ;
    };
	
	function grayscale(imageData) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = (r+g+b)/3;
		}
		return imageData ;
	}
	
	function duotone(imageData) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			r = (r+g+b)/3;
			imageData.data[i] = r;
		}
		return imageData ;
	}
	
	function noise(imageData, upper, lower) {
		if(arguments.length < 2) {
			upper = 30 ;
			lower = -30 ;
		}
		var radius = upper - lower ;
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			mod = Math.floor((Math.random() * radius) - upper);
			r += mod ;
			g += mod ;
			b += mod ;
			imageData.data[i] = r;
			imageData.data[i + 1] = g;
			imageData.data[i + 2] = b;
		}
		return imageData ;
	}
	
	function invert(imageData) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = 255 - r;
			imageData.data[i + 1] = 255 - g;
			imageData.data[i + 2] = 255 - b;
		}
		return imageData ;
	}
	
	function pixelate(imageData) {
		var width = imageData.width ;
		var height = imageData.height ;
		for(var y = 1; y < height; y+=3) {
			for(var x = 1; x < width; x+=3) {
				r = imageData.data[((width * y) + x) * 4];
				g = imageData.data[((width * y) + x) * 4 + 1];
				b = imageData.data[((width * y) + x) * 4 + 2];
					
				imageData.data[((width * (y-1)) + (x-1)) * 4] = r ;
				imageData.data[((width * (y-1)) + (x-1)) * 4 + 1] = g ;
				imageData.data[((width * (y-1)) + (x-1)) * 4 + 2] = b ;
				imageData.data[((width * (y+1)) + (x-1)) * 4] = r ;
				imageData.data[((width * (y+1)) + (x-1)) * 4 + 1] = g ;
				imageData.data[((width * (y+1)) + (x-1)) * 4 + 2] = b ;
				imageData.data[((width * (y-1)) + (x+1)) * 4] = r ;
				imageData.data[((width * (y-1)) + (x+1)) * 4 + 1] = g ;
				imageData.data[((width * (y-1)) + (x+1)) * 4 + 2] = b ;
				imageData.data[((width * (y+1)) + (x+1)) * 4] = r ;
				imageData.data[((width * (y+1)) + (x+1)) * 4 + 1] = g ;
				imageData.data[((width * (y+1)) + (x+1)) * 4 + 2] = b ;
				imageData.data[((width * (y-1)) + (x)) * 4] = r ;
				imageData.data[((width * (y-1)) + (x)) * 4 + 1] = g ;
				imageData.data[((width * (y-1)) + (x)) * 4 + 2] = b ;
				imageData.data[((width * (y)) + (x-1)) * 4] = r ;
				imageData.data[((width * (y)) + (x-1)) * 4 + 1] = g ;
				imageData.data[((width * (y)) + (x-1)) * 4 + 2] = b ;
				imageData.data[((width * (y)) + (x+1)) * 4] = r ;
				imageData.data[((width * (y)) + (x+1)) * 4 + 1] = g ;
				imageData.data[((width * (y)) + (x+1)) * 4 + 2] = b ;
				imageData.data[((width * (y+1)) + (x)) * 4] = r ;
				imageData.data[((width * (y+1)) + (x)) * 4 + 1] = g ;
				imageData.data[((width * (y+1)) + (x)) * 4 + 2] = b ;
			}
		}	
		return imageData ;
	}
	
	function gamma(imageData, amount) {
		if(arguments.length < 2)
			amount = 0.2 ;
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = 255 * Math.pow(r / 255, amount); 
			imageData.data[i + 1] = 255 * Math.pow(g / 255, amount);
			imageData.data[i + 2] = 255 * Math.pow(b / 255, amount);
		}
		return imageData ;
	}
		
	
	function brighten(imageData) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = ((255 - r) > 30) ? r + 20 : r ;
			imageData.data[i + 1] = ((255 - g) > 30) ? g + 20 : g;
			imageData.data[i + 2] = ((255 - b) > 30) ? b + 20 : b;
		}
		return imageData ;
	}
	
	function sepiaTone(imageData) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			r = (r * 0.393) + (g * 0.769) + (b * 0.189);
			g = (r * 0.349) + (g * 0.686) + (b * 0.168);
			b = (r * 0.272) + (g * 0.534) + (b * 0.131);
			imageData.data[i] = (r > 255) ? 255 : r ;
			imageData.data[i + 1] = (g > 255) ? 255 : g ;
			imageData.data[i + 2] = (b > 255) ? 255 : b ;
		}
		return imageData ;
	}
	
	function contrast(imageData, amount) {
		if(arguments.length < 2)
			amount = 2 ;
		if(amount < -100) 
			amount = -100 ;
		else if(amount > 100) 
			amount = 100 ;
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			r = ((((r / 255) - 0.5) * amount) + 0.5) * 255 ;
			g = ((((g / 255) - 0.5) * amount) + 0.5) * 255 ;
			b = ((((b / 255) - 0.5) * amount) + 0.5) * 255 ;
			if(r < 0) 
				r = 0 ;
			else if(r > 255)
				r = 255 ;
			if(g < 0) 
				g = 0 ;
			else if(g > 255)
				g = 255 ;
			if(b < 0) 
				b = 0 ;
			else if(b > 255)
				b = 255 ;
			imageData.data[i] = r ;
			imageData.data[i + 1] = g ;
			imageData.data[i + 2] = b ;
		}
		return imageData ;
	}
	
	function threshold(imageData, value) {
		if(arguments.length < 2)
			value = 10 ;
		for(var i = 0; i < imageData.data.length-1; i += 4) {
			ra = imageData.data[i];
			ga = imageData.data[i + 1];
			ba = imageData.data[i + 2];
			rb = imageData.data[i + 4];
			gb = imageData.data[i + 5];
			bb = imageData.data[i + 6];
			val = 0.2126*(ra - rb) + 0.7152*(ga - gb) + 0.0722*(ba - bb) ;
			if(val > value) {
				imageData.data[i] = 24 ;
				imageData.data[i + 1] = 255 ;
				imageData.data[i + 2] = 3 ;
			}
		}
		return imageData ;
	}
	
	function getColor(image, x, y) {
		return { r : image.data[((image.width * y) + x) * 4],
			     g : image.data[((image.width * y) + x) * 4],
			     b : image.data[((image.width * y) + x) * 4] };
	}
	
	function medianFilter(imageData) {
		convolute(imageData, [ 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1 ], true);
		return imageData ;
	}
				
	
	function sobel(imageData, color) {
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = (r+g+b)/3;
		}
		var vertical = convoluteFloat32(imageData, [ -1, 0, 1, -2, 0, 2, -1, 0, 1 ], true);
		var horizontal = convoluteFloat32(imageData,[ -1, -2, -1, 0, 0, 0, 1, 2, 1 ], true);
		if(color) {
			for (var i=0; i<imageData.data.length; i+=4) {
				v = Math.abs(vertical[i]);
				h = Math.abs(horizontal[i]);
				imageData.data[i] = v;
				imageData.data[i+1] = h;
				imageData.data[i+2] = (v+h)/4;
				//imageData.data[i+3] = ;
			}
		} else {
			for (var i=0; i<imageData.data.length; i+=4) {
				v = Math.abs(vertical[i]);
				h = Math.abs(horizontal[i]);
				imageData.data[i] = v;
				imageData.data[i+1] = h;
				imageData.data[i+2] = (v+h)/2;
				//imageData.data[i+3] = ;
			}
			grayscale(imageData);
		}
		return imageData ;
	}
	
	function darken(imageData) {
		return convolute(imageData, [ 0, 0, 0, 0, 6/9, 0, 0, 0, 0 ], true);
	}
	
	function lighten(imageData) {
		convolute(imageData, [ 0, 0, 0, 0, 12/9, 0, 0, 0, 0 ], true);
	}
	
	function pencilSketch(imageData) {
	
		function clone(obj) {
			if (null == obj || "object" != typeof obj) 
				return obj;
			var copy = {} ;
			for (var attr in obj) 
				if (obj.hasOwnProperty(attr)) 
					copy[attr] = clone(obj[attr]);
			return copy;
		}
		
		var image1 = clone(imageData) ;
		var image2 = clone(imageData);
		image1 = invert(image1);
		image2 = convolute(imageData, [ 1, 2, 1, 2, 1, 2, 1, 2, 1 ], true, true);
		for(var i = 0; i < imageData.data.length; i += 4) {
			r1 = image1.data[i];
			g1 = image1.data[i + 1];
			b1 = image1.data[i + 2];
			r2 = image2.data[i];
			g2 = image2.data[i + 1];
			b2 = image2.data[i + 2];
			imageData.data[i] = Math.min(255, r1 + r2);
			imageData.data[i + 1] = Math.min(255, g1 + g2);
			imageData.data[i + 2] = Math.min(255, b1 + b2);
		}
		grayscale(imageData);
		return imageData ;	
	}
	
	function gaussianBlur(imageData) {
		return convolute(imageData, [ 
		0.0030, 0.0133, 0.0219, 0.0133, 0.0030,
		0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
		0.0219, 0.0983, 0.1621, 0.0983, 0.0219,
		0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
		0.0030, 0.0133, 0.0219, 0.0133, 0.0030 ], true);
	}
	
	function posterize(imageData, colors) {
		if(arguments.length < 2) {
			colors = 40 ;
		}
		var levels = [] ;
		var level = 1 ;
		for(var i = 0; i < 256; ++i) {
			if( i < (colors * level) )
				levels[i] = colors * (level - 1) ;
			else {
				levels[i] = (colors * level) ;
				++level ;
			}
		}
		for(var i = 0; i < imageData.data.length; i += 4) {
			r = imageData.data[i];
			g = imageData.data[i + 1];
			b = imageData.data[i + 2];
			imageData.data[i] = levels[r] ;
			imageData.data[i + 1] = levels[g] ;
			imageData.data[i + 2] = levels[b] ;
		}
		return imageData ;
	}
	
	return {
		convolute : convolute,
		convolute32 : convoluteFloat32,
		grayscale : grayscale,
		brighten : brighten,
		noise : noise,
		invert : invert,
		pixelate : pixelate,
		duotone : duotone,
		sobel : sobel,
		sepiaTone : sepiaTone,
		contrast : contrast,
		threshold : threshold,
		gamma : gamma,
		pencilSketch : pencilSketch,
		gaussianBlur : gaussianBlur,
		posterize : posterize,
		darken : darken,
		lighten : lighten
	};
}());