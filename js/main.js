window.onload=function(){
	// [H,S,L] > [R,G,B]
	// H: 0-360 S:0-100 L:0-100
	// RGB:0-255
	function hsl2rgb(hsl){
		let h = hsl[0] / 360,
			s = hsl[1] / 100,
			l = hsl[2] / 100,
			t1, t2, t3, rgb, val;

		if(s === 0){
			val = Math.floor(l * 255);
			return [val, val, val];
		}

		if(l < 0.5){
			t2 = l * (1 + s);
		}else{
			t2 = l + s - l * s;
		}
		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for(var i = 0; i < 3; i++){
			t3 = h + 1 / 3 * -(i - 1);
			if(t3 < 0){
				t3++;
			}
			if(t3 > 1){
				t3--;
			}

			if(6 * t3 < 1){
				val = t1 + (t2 - t1) * 6 * t3;
			}else if(2 * t3 < 1){
				val = t2;
			}else if(3 * t3 < 2){
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			}else {
				val = t1;
			}

			rgb[i] = Math.floor(val * 255);
		}
		return rgb
	}

	// [R,G,B] > [H,S,L]
	// RGB:0-255
	// H: 0-360 S:0-100 L:0-100
	function rgb2hsl(rgb){
		let r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255,
			min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			delta = max - min,
			h, s, l;

		if(max === min){
			h = 0;
		}else if(r === max){
			h = (g - b) / delta;
		}else if(g === max){
			h = 2 + (b - r) / delta;
		}else if(b === max){
			h = 4 + (r - g) / delta;
		}
		h = Math.min(h * 60, 360);
		if(h < 0){
			h += 360;
		}

		l = (min + max) / 2;

		if(max === min){
			s = 0;
		}else if(l <= 0.5){
			s = delta / (max + min);
		}else {
			s = delta / (2 - max - min);
		}

		return [Math.floor(h), Math.floor(s*100), Math.floor(l*100),]
	}

	// #hex > [R,G,B]
	function hex2rgb(hex){
		if(hex.indexOf(',') > 0){
			return hex.split(',').map(d => parseInt(d));
		}
		if(hex.slice(0,1) == '#'){
			hex = hex.slice(1);
		}
		if(hex.length == 3){
			hex = hex.split('').map(d => ''+d+d).join('');
		}
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

	// [h,S,L] > hsl(H,S%,L%)
	function normalizeCSSHSL(hsl){
		return 'hsl('+hsl[0]+','+hsl[1]+'%,'+hsl[2]+'%)';
	}

	// HTMLを経由した色整形
	function convertToRGB(color){
		let temp = document.createElement("span");
		temp.style.backgroundColor = color;
		return temp.style.backgroundColor;
	}

	// 色判定
	function isColor(color){
		return convertToRGB(color) !== "";
	}
	// hex / rgb() / hsl() 判別
	function checkColorFormat(color){
		if(isColor(color)){
			return (color.charAt(0) === "#") ? "hex" : color.match(/^(.+)\(/g)[0].slice(0,-1);
		}else{
			return false;
		}
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

	// DOM除去
	function removeDOM(d){
		d.map((d) =>{
			while(d.lastChild) d.removeChild(d.lastChild);
		});
	}

	// コントラスト比が基準値以上の場合のみ、カラーピース内にテキストノードを設定
	function setColorPieceAlt(minContrast){
		let piece = document.querySelectorAll('.palette--piece');
		for(let i = 0; i < piece.length; i++){
			piece[i].textContent = ((submitVal.singleColor)? minContrast <= piece[i].dataset.contrast : minContrast <= piece[i].dataset.contrast && minContrast <= piece[i].dataset.contrast2)? rgb2hex(normalizeRGB(piece[i].style.color)) : '';
		}
	}

	// カラーパレット / リザルト 表示
	function viewResultDOM(color,color2){
		removeDOM([resultInputColor,resultSelectionColor,resultContrast,resultInputAdditionalColor,resultAdditionalColorContrast]);
		document.getElementById('result').style.visibility = 'visible';
		document.getElementById('resultInputColor').insertAdjacentHTML('beforeend',(checkColorFormat(color)=="hex") ? rgb2hex(hex2rgb(color)) : color); //hexの省略記法対応
		document.getElementById('resultInputColor').style.borderLeftColor = color;
		if(color2){
			document.getElementById('resultAdditionalColor').style.display = 'table-row';
			document.getElementById('resultInputAdditionalColor').insertAdjacentHTML('beforeend',(checkColorFormat(color2)=="hex") ? rgb2hex(hex2rgb(color2)) : color2);
			document.getElementById('resultInputAdditionalColor').style.borderLeftColor = color2;
		}else{
			document.getElementById('resultAdditionalColor').style.display = 'none';
		}
	}

	// カラーパレットリセット
	function setColorPalette(inputColor,inputAdditionalColor){
		let paletteRange = Number(document.forms[0].selectPaletteSize.value),
			paletteFullColor = document.getElementById('paletteFullColor'),
			paletteGray = document.getElementById('paletteGray'),
			evalColor,evalContrast,evalContrast2,glayColorList  = [],
			grayDOM = "",
			fullColorDOM = "";

		document.getElementById('view').style.visibility = "hidden";

		//入力色1をHTML経由でフォーマットしてからhexに変換
		inputColor = rgb2hex(normalizeRGB(convertToRGB(inputColor)));
		if(inputAdditionalColor) inputAdditionalColor = rgb2hex(normalizeRGB(convertToRGB(inputAdditionalColor)));

		// X軸をHUE、Y軸を彩度Saturation、ページをLightnessでカラーパレット生成
		for (let l = 100 - (50%paletteRange); l >= 0; l = l - paletteRange){
			fullColorDOM += '<div class="palette--page" data-lightness="'+l+'">';
			for (let s = 100; s >= 0; s = s - paletteRange){
				fullColorDOM += '<div class="palette--row">';
				for (let h = 0; h < 360; h = h + paletteRange){
					// カラーピースの色をコントラスト評価のためにHSL > hexに変換
					evalColor = rgb2hex(hsl2rgb([h,s,l]));
					// カラーピースと入力色1でコントラスト評価
					evalContrast = getContrast(inputColor, evalColor);
					// 入力色2がある場合、入力色2でもコントラスト評価
					if(inputAdditionalColor){
						evalContrast2 = getContrast(inputAdditionalColor, evalColor);
					}
					//白/黒を除外してカラーピース出力
					if(!(l==0 || l==100 || s==0)){
						fullColorDOM += `<a href="#view" class="palette--piece" style="color:${evalColor};" data-hls="${h},${s}%,${l}%" data-contrast="${evalContrast}"${(inputAdditionalColor)?` data-contrast2=\"${evalContrast2}\"`:''}>${evalColor}</a>`;
					}
				}
				fullColorDOM += '</div>';
			}
			fullColorDOM += '</div>';
		}

		// グレースケールのカラーパレット生成
		for (let l = 100; l >= 0; l = l - paletteRange){
			evalColor = rgb2hex(hsl2rgb([0,0,l]));
			evalContrast = getContrast(inputColor, evalColor);
			if(inputAdditionalColor){
				evalContrast2 = getContrast(inputAdditionalColor, evalColor);
			}
			if(glayColorList.indexOf(evalColor)<0){
				grayDOM += `<a href="#view" class="palette--piece" style="color:${evalColor};" data-hls="${0},${0}%,${l}%" data-contrast="${evalContrast}"${(inputAdditionalColor)?` data-contrast2=\"${evalContrast2}\"`:''}>${evalColor}</a>`;
				glayColorList.push(evalColor);
			}
		}
		paletteGray.setAttribute('data-size', paletteRange);
		paletteFullColor.setAttribute('data-size', paletteRange);
		paletteGray.insertAdjacentHTML('beforeend', grayDOM);

		let range = document.createRange();
		paletteFullColor.appendChild(range.createContextualFragment(fullColorDOM));
		range.detach();

		setColorPieceAlt(Number(document.getElementById('inputContrast').value));
	}

	// テキストサンプル表示
	function setExsamle(rgb){
		removeDOM([resultSelectionColor,resultContrast,resultAdditionalColorContrast]);
		document.getElementById('view').style.visibility = 'visible';
		// 入力色の形式に合わせて変換
		let selectionColor;
		switch (checkColorFormat(submitVal.color1)) {
			case 'hex':
				selectionColor = rgb2hex(normalizeRGB(rgb));
				break;
			case 'hsl':
				selectionColor = normalizeCSSHSL(rgb2hsl(normalizeRGB(rgb)));
				break;
			default:
				selectionColor = rgb;
		}

		//入力色1、選択色をHTML経由でフォーマットしてからhexに変換して、コントラスト取得
		let selectionContrast = getContrast(rgb2hex(normalizeRGB(convertToRGB(submitVal.color1))),rgb2hex(normalizeRGB(convertToRGB(selectionColor)))),
			isAdapt = Number(document.getElementById('inputContrast').value) < selectionContrast;

		document.getElementById('resultSelectionColor').style.borderColor = selectionColor;
		document.getElementById('resultSelectionColor').insertAdjacentHTML('beforeend',selectionColor);

		document.getElementById('resultContrast').insertAdjacentHTML('beforeend', Math.round(selectionContrast * 1000) / 1000);
		document.getElementById('resultContrast').style.color = (isAdapt)? 'blue' : 'red';

		document.getElementById('viewText').style.backgroundColor = submitVal.color1;
		document.getElementById('viewText').style.color = selectionColor;
		Array.from(document.querySelectorAll('#viewText a')).map(d => d.style.color = selectionColor);

		if(submitVal.singleColor){
			setGuide(submitVal.color1,selectionColor,selectionColor);
		}else{
			selectionContrast2 = getContrast(rgb2hex(normalizeRGB(convertToRGB(submitVal.color2))),rgb2hex(normalizeRGB(convertToRGB(selectionColor)))),
			isAdapt2 = Number(document.getElementById('inputContrast').value) < selectionContrast2;

			document.getElementById('resultAdditionalColorContrast').insertAdjacentHTML('beforeend', Math.round(selectionContrast2 * 1000) / 1000);
			document.getElementById('resultAdditionalColorContrast').style.color = (isAdapt2)? 'blue' : 'red';

			Array.from(document.querySelectorAll('#viewText a')).map(d => d.style.color = submitVal.color2);
			setGuide(submitVal.color1,selectionColor,submitVal.color2);
		}
	}

	// テキストサンプル凡例表示
	function setGuide(color1,color2,color3){
		removeDOM([viewGuideBg,viewGuideText,viewGuideLink]);
		let bg = document.getElementById('viewGuideBg'),
			text = document.getElementById('viewGuideText'),
			link = document.getElementById('viewGuideLink'),
			colorVal = [color1,color2,color3];

		// 入力色の形式に合わせて変換
		switch (checkColorFormat(submitVal.color1)) {
			case 'hex':
				colorVal.map((v,i,a) => a[i] = rgb2hex(normalizeRGB(convertToRGB(v))));
				break;
			case 'hsl':
				colorVal.map((v,i,a) => a[i] = normalizeCSSHSL(rgb2hsl(normalizeRGB(convertToRGB(v)))));
				break;
			default:
				colorVal.map((v,i,a) => a[i] = convertToRGB(v));
		}

		bg.insertAdjacentHTML('beforeend',colorVal[0]);
		bg.style.borderLeftColor = colorVal[0];
		text.insertAdjacentHTML('beforeend',colorVal[1]);
		text.style.borderLeftColor = colorVal[1];
		link.insertAdjacentHTML('beforeend',(submitVal.singleColor)? colorVal[1] : colorVal[2]);
		link.style.borderLeftColor = (submitVal.singleColor)? colorVal[1] : colorVal[2];
	}

	// カラーパレットレンジ変更
	function resizeRange(){
		let range = Number(document.forms[0].selectPaletteSize.value);
		document.forms[0].sliderRange.max = 100 + (50%range) - range;
		document.forms[0].sliderRange.min = 0 - (50%range) + range;
		document.forms[0].sliderRange.step = range;
		document.forms[0].sliderRange.value = '50';
		document.getElementById('sliderValue').textContent = 100 - Number(document.forms[0].sliderRange.value);
	}

	let submitVal = {
		"singleColor" : true,
		"color1" : "",
		"color2" :  ""
	}

	//確認ボタン
	document.getElementById('inputColorSubmit').addEventListener('click', (e) => {
		document.forms[0].inputColorValue.style.color = '';
		submitVal.color1 = document.forms[0].inputColorValue.value;

		document.getElementById('selectContrast').style.visibility = 'visible';
		document.getElementById('palette').style.visibility = 'visible';
		document.getElementById('result').style.visibility = 'visible';
		removeDOM([paletteGray,paletteFullColor]);

		if(document.forms[0].addInputColor.checked){
			submitVal.singleColor = false;
			submitVal.color2 = document.forms[0].inputAdditionalColorValue.value;
			setColorPalette(submitVal.color1,submitVal.color2);
			viewResultDOM(submitVal.color1,submitVal.color2);
		}else{
			submitVal.singleColor = true;
			setColorPalette(submitVal.color1);
			setColorPieceAlt(Number(document.getElementById('inputContrast').value));
			viewResultDOM(submitVal.color1);
		}


	});

	//カラーパレットサイズラジオ
	for(var i=0; i<document.forms[0].selectPaletteSize.length; i++){
		document.forms[0].selectPaletteSize[i].addEventListener('click', (e) => {
			removeDOM([paletteGray,paletteFullColor]);
			resizeRange();
			setColorPalette(submitVal.color1,submitVal.color2);
		});
	}

	// コントラスト値入力ボックス
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
	const paletteGray = document.getElementById('paletteGray'),
		paletteFullColor = document.getElementById('paletteFullColor'),
		palettes = [paletteGray, paletteFullColor];
	palettes.forEach(d=>{
		d.addEventListener('click',(e)=> setExsamle(e.target.style.color));
	});

	//カラーピース hoverの再実装
	let prevHoverPiece;
	document.getElementById('paletteFullColor').addEventListener('mousemove', (e) => {
		let interval = 800,
			lastTime = new Date().getTime() - interval;
		if((lastTime + interval) <= new Date().getTime()){
			lastTime = new Date().getTime();
			if(prevHoverPiece && (prevHoverPiece.textContent != e.target.textContent)){
				prevHoverPiece.classList.remove('__hover');
				if(e.target.textContent) e.target.classList.add('__hover');
			}
			prevHoverPiece = e.target;
		}
	});
	document.getElementById('paletteFullColor').addEventListener('mouseout', (e) => {
		prevHoverPiece.classList.remove('__hover');
	});

	//入替えボタン選択
	let swipeCount = 0;
	document.getElementById('swap').addEventListener('click', (e) => {
		let view = document.getElementById('viewText').style,
			bgColor = view.backgroundColor,
			color = view.color;
			linkColor = document.querySelector('#viewText a').style.color;
		if(submitVal.singleColor){
			view.backgroundColor = color;
			view.color = bgColor;
			Array.from(document.querySelectorAll('#viewText a')).map(d => d.style.color = bgColor);
			setGuide(color,bgColor,bgColor);
		}else{
			swipeCount++;
			if(swipeCount === 3 || swipeCount === 6){
				view.backgroundColor = color;
				view.color = bgColor;
				Array.from(document.querySelectorAll('#viewText a')).map(d => d.style.color = linkColor);
				setGuide(color,bgColor,linkColor);
			}else{
				view.backgroundColor = color;
				view.color = linkColor;
				Array.from(document.querySelectorAll('#viewText a')).map(d => d.style.color = bgColor);
				setGuide(color,linkColor,bgColor);
			}
			if(swipeCount === 6){
				swipeCount = 0;
			}
		}
	});
	document.getElementById('size').addEventListener('click', (e) => {
		document.getElementById('viewText').classList.toggle("__large");
	});

	resizeRange();
}