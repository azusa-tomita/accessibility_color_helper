window.onload=function(){

	// [H,S,L] > [R,G,B]
	function hsl2rgb(hsl){
		let h = hsl[0],
			s = hsl[1] / 100,
			l = hsl[2] / 100,
			c = (1 - Math.abs(2 * l - 1)) * s,
			x = c * (1 - Math.abs((h / 60) % 2 - 1)),
			m = l - c/2,
			r = 0,
			g = 0,
			b = 0;
	
		if(0 <= h && h < 60){
			r = c; g = x; b = 0;
		}else if(60 <= h && h < 120){
			r = x; g = c; b = 0;
		}else if(120 <= h && h < 180){
			r = 0; g = c; b = x;
		}else if(180 <= h && h < 240){
			r = 0; g = x; b = c;
		}else if(240 <= h && h < 300){
			r = x; g = 0; b = c;
		}else if(300 <= h && h <= 360){
			r = c; g = 0; b = x;
		}
		return  [r,g,b].map(d => Math.round((d + m) * 255));
	}
	
	// #hex > [R,G,B]
	function hex2rgb(hex){
		if(hex.indexOf(',') > 0) return hex.split(',').map(d => parseInt(d));
		if(hex.slice(0,1) == '#') hex = hex.slice(1);
		if(hex.length == 3) hex = hex.split('').map(d => ''+d+d).join('');
		return [hex.slice(0,2), hex.slice(2,4), hex.slice(4,6)].map(d => parseInt(d,16));
	}
	
	// [R,G,B] > #hex
	function rgb2hex(rgb){
		return '#' + rgb.map(d => ('0' + d.toString(16)).slice(-2)).join('');
	}
	// rgb(R,G,B) > [R,G,B]
	function normalizeRGB(rgb){
		let reg = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return (reg)? reg.map(d => parseInt(d)).slice(1) : rgb;
	}
	
	
	// getContrast(hex,hex)
	function getLum(v){
		v = v.map(d => d / 255).map(d => d <= 0.03928 ? d / 12.92 : Math.pow((d + 0.055) / 1.055, 2.4));
		return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
	}
	function getContrast(l1, l2){
		let r = [l1,l2].map(d => getLum(hex2rgb(d)) + 0.05);
		return (r[0] > r[1]) ? r[0] / r[1] : r[1] / r[0];
	}
	
	
	function removeDOM(d){
		d.map((d) =>{
			while(d.lastChild) d.removeChild(d.lastChild);
		});
	}
	
	function setColorPieceAlt(minContrast){
		let piece = document.querySelectorAll('.palette--piece');
		for(let i = 0; i < piece.length; i++){
			piece[i].textContent = (minContrast <= piece[i].dataset.contrast)? rgb2hex(normalizeRGB(piece[i].style.color)) : '';
		}
	}
	
	
	function setColorPalette(){
		let inputColor = document.forms[0].inputColorValue.value,
			paletteRange = Number(document.forms[0].selectPaletteSize.value),
			paletteFullColor = document.getElementById('paletteFullColor'),
			paletteGray = document.getElementById('paletteGray'),
			evalColor,evalContrast,glayColorList  = [],
			grayDOM,fullColorDOM = "";
	
		document.getElementById('view').style.visibility = "hidden";
	
		for (let l = 100 - (50%paletteRange); l >= 0; l = l - paletteRange) {
			fullColorDOM += '<div class="palette--page" data-lightness="'+l+'">';
			for (let s = 100; s >= 0; s = s - paletteRange) {
				fullColorDOM += '<div class="palette--row">';
				for (let h = 0; h < 360; h = h + paletteRange) {
					evalColor = rgb2hex(hsl2rgb([h,s,l]));
					evalContrast = getContrast(inputColor, evalColor);
					if(l==0 || l==100 || s==0){
					}else{
						fullColorDOM += '<a href="#view" class="palette--piece" style="color:'+evalColor+';" data-hls="'+h+','+s+'%,'+l+'%" data-contrast="'+evalContrast+'">'+evalColor+'</a>';
					}
	
				}
				fullColorDOM += '</div>';
			}
			
			fullColorDOM += '</div>';
		}
	
		for (let l = 100; l >= 0; l = l - paletteRange) {
			evalColor = rgb2hex(hsl2rgb([0,0,l]));
			evalContrast = getContrast(inputColor, evalColor);
			if(glayColorList.indexOf(evalColor)<0){
				grayDOM += '<a href="#view" class="palette--piece" style="color:'+evalColor+';" data-hls="'+0+','+0+'%,'+ l +'%" data-contrast="'+evalContrast+'">'+evalColor+'</a>';
				glayColorList.push(evalColor);
			}
		}
	
		
		paletteGray.setAttribute('data-size', paletteRange);
		paletteFullColor.setAttribute('data-size', paletteRange);
		paletteGray.insertAdjacentHTML('beforeend', grayDOM);
		var range = document.createRange();
		paletteFullColor.appendChild(range.createContextualFragment(fullColorDOM));
		range.detach();

		removeDOM([resultInputColor,resultSelectionColor,resultContrast]);
		document.getElementById('resultSelectionColor').style.borderColor = 'transparent';
		document.getElementById('result').style.visibility = 'visible';
		document.getElementById('resultInputColor').style.borderColor = inputColor;
		document.getElementById('resultInputColor').insertAdjacentHTML('beforeend',rgb2hex(hex2rgb(inputColor)));
	
		setColorPieceAlt(Number(document.getElementById('inputContrast').value));
	}
	
	
	function setView(rgb){
		removeDOM([resultSelectionColor,resultContrast]);
		document.getElementById('view').style.visibility = 'visible';
	
		let inputColor = rgb2hex(hex2rgb(document.forms[0].inputColorValue.value)),
			selectionColor = rgb2hex(normalizeRGB(rgb)),
			selectionContrast = getContrast(inputColor,selectionColor),
			isAdapt = Number(document.getElementById('inputContrast').value) < selectionContrast;

		document.getElementById('resultSelectionColor').style.borderColor = selectionColor;
		document.getElementById('resultSelectionColor').insertAdjacentHTML('beforeend',selectionColor);
	
		document.getElementById('resultContrast').insertAdjacentHTML('beforeend', Math.round(selectionContrast * 1000) / 1000);
		document.getElementById('resultContrast').style.color = (isAdapt)? 'blue' : 'red';
	
		document.getElementById('viewText').style.backgroundColor = inputColor;
		document.getElementById('viewText').style.color = selectionColor;
	}
	
	function resizeRange(){
		let range = Number(document.forms[0].selectPaletteSize.value);
		document.forms[0].sliderRange.max = 100 + (50%range) - range;
		document.forms[0].sliderRange.min = 0 - (50%range) + range;
		document.forms[0].sliderRange.step = range;
		document.forms[0].sliderRange.value = '50';
		document.getElementById('sliderValue').textContent = 100 - Number(document.forms[0].sliderRange.value);
	}
	
	
	//確認ボタン
	document.getElementById('inputColorSubmit').addEventListener('click', (e) => {
		setColorPieceAlt(Number(document.getElementById('inputContrast').value));
		document.getElementById('selectContrast').style.visibility = 'visible';
		document.getElementById('palette').style.visibility = 'visible';
		document.getElementById('result').style.visibility = 'visible';
		removeDOM([paletteGray,paletteFullColor]);
		setColorPalette();
	});
	
	
	
	//カラーパレットサイズラジオ
	for(var i=0; i<document.forms[0].selectPaletteSize.length; i++) {
		document.forms[0].selectPaletteSize[i].addEventListener('click', (e) => {
			removeDOM([paletteGray,paletteFullColor]);
			resizeRange();
			setColorPalette();
		});
	}
	
	// inputCntrast
	document.getElementById('inputContrast').addEventListener('blur', (e) => {
		setColorPieceAlt(Number(document.getElementById('inputContrast').value));
	});
	
	
	//明度レンジ
	document.getElementById('sliderRange').addEventListener('input', (e) => {
		let val = 100 - Number(e.target.value);
		document.getElementById('sliderValue').textContent = val;
	});
	
	//明度レンジ値変化監視
	const target = document.getElementById('sliderValue');
	const observer = new MutationObserver(r => {
		document.getElementById('paletteFullColor').setAttribute('data-lightness', r[0].target.textContent);
	});
	observer.observe(target, {
	  characterData: true,
	  childList: true,
	});
	
	
	
	//カラーピース選択
	document.getElementById('paletteGray').addEventListener('click', (e) => {
		if(e.target.style.color) setView(e.target.style.color);
	});
	document.getElementById('paletteFullColor').addEventListener('click', (e) => {
		if(e.target.style.color) setView(e.target.style.color);
	});
	
	//カラーピース hoverの再実装
	let prevHoverPiece;
	document.getElementById('paletteFullColor').addEventListener('mousemove', (e) => {
		let interval = 800,
			lastTime = new Date().getTime() - interval;
		{
			if ((lastTime + interval) <= new Date().getTime()){
				lastTime = new Date().getTime();
	
				if(prevHoverPiece && (prevHoverPiece.textContent != e.target.textContent)){
					prevHoverPiece.classList.remove('__hover');
					if(e.target.textContent) e.target.classList.add('__hover');
				}
				prevHoverPiece = e.target;
			}
		}
	});
	document.getElementById('paletteFullColor').addEventListener('mouseout', (e) => {
		prevHoverPiece.classList.remove('__hover');
	});
	
	//入替えボタン
	document.getElementById('swap').addEventListener('click', (e) => {
		let text = document.getElementById('viewText').style,
			bgColor = text.backgroundColor,
			color = text.color;
		text.backgroundColor = color;
		text.color = bgColor;
	});
	document.getElementById('size').addEventListener('click', (e) => {
		document.getElementById('viewText').classList.toggle("__large");
	});
	
	
	resizeRange();
	}