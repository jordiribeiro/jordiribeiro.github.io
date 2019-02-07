// ************************************** //
//Pega as horas, minutos e segundos agora
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function horaAgora() {
    var d = new Date();
    var h = addZero(d.getHours());
    var m = addZero(d.getMinutes());
    var s = addZero(d.getSeconds());
    //return (h + ":" + m + ":" + s);
    return (h + ":" + m);
}
// ************************************** //

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

 function atualizaInformacoesNaTelaUDI(snapshotDoBanco){
	var todos        = snapshotDoBanco.todos,
		timestamp    = snapshotDoBanco.timestamp,
		count        = snapshotDoBanco.todos.length,
		chamados     = [];

	aguardando = tratamento = outros = 	aguardandoIE = 	tratamentoIE =  aguardandoWMS =  tratamentoWMS = aguardandoQkView = tratamentoQkView = aguardandoCamisa10 = tratamentoCamisa10 = aguardandoModFabril = tratamentoModFabril = aguardandoInterAct = tratamentoInterAct = aguardandoPMcycle = tratamentoPMcycle = aguardandoSegAmbev = tratamentoSegAmbev = aguardandoMES = tratamentoMES = aguardandoNovoMES = tratamentoNovoMES =  aguardandoTMS = tratamentoTMS= 0;

	todos.forEach(chamado => {
		var status = chamado.status;
			status == "Aguardando tratamento" ? aguardando++ : (status == "Em tratamento" ? tratamento++ : outros++);

		var oferta = chamado.oferta,
		 	sti    = oferta.substr(oferta.indexOf("(STI"));
		descobreOferta(sti, chamado.status);
	});

	todos.forEach(chamado => {
		var oferta = chamado.oferta,
			ceng   = oferta.substr(oferta.indexOf("(CENG"));
		descobreOferta(ceng, chamado.status);
	});

	yMax = Math.ceil(getMaxOfArray( [
							aguardandoIE,tratamentoIE,
							aguardandoWMS, tratamentoWMS,
							aguardandoQkView, tratamentoQkView,
							aguardandoCamisa10, tratamentoCamisa10,
							aguardandoModFabril, tratamentoModFabril,
              aguardandoSegAmbev, tratamentoSegAmbev,
              aguardandoMES, tratamentoMES,
							aguardandoNovoMES, tratamentoNovoMES,
              aguardandoTMS, tratamentoTMS,
							aguardandoInterAct, tratamentoInterAct,
							aguardandoPMcycle, tratamentoPMcycle] ) / 10) * 10;

	var totaisUDI = calculaTotalChamadosUdi(); // Retorna um array como [totalTratamendo, totalAguardando]

	setaOptionsDefault2();
	rederizaOsGraficos(totaisUDI);
}

function deveSalvarOuNao(){
	// if(localStorage.getItem("proxSave") == null || minSalvou == undefined){
	if(localStorage.getItem("minSalvou") == null){
		minSalvou = parseInt(horaAgora().split(":")[1]);
		localStorage.setItem("minSalvou", minSalvou);
		return true;
	}
	minSalvou    = parseInt(localStorage.getItem("minSalvou"));
	var minNow   = parseInt(horaAgora().split(":")[1]),
	    proxSave = (minSalvou + passo) > 60 ? ((minSalvou + passo) - 60) : (minSalvou + passo); // O próximo minuto que deve ser salvo as informações em localStorage
	localStorage.setItem("proxSave", proxSave);

	if(minNow >= proxSave){
		minSalvou = parseInt(horaAgora().split(":")[1]);
		localStorage.setItem("minSalvou", minSalvou);
		return true;
	}
	return false;
}

function pushDeDados(totaisUDI){
	//Seta no localStorage todos os arrays atualizados se no minuto atual não foi setado
	if(deveSalvarOuNao()){
		//Se o tamanho dos arrays forem maiores do que o limite pré-estabelecidos remove um item
		// da cabeça para depois inserir outro na cauda
		if(arrayLabel.length > tamanhoGrafDeLinhas-1){
			arrayAguardando.shift();
			arrayTratamento.shift();
			arrayOutros.shift();
			arrayLabel.shift();
		}

		//Insere os novos elementos na calda
		arrayTratamento.push(totaisUDI[0]);
		arrayAguardando.push(totaisUDI[1]);
		arrayOutros.push(outros);
		arrayLabel.push(horaAgora());

		//Seta todos os dados em localStorage
		localStorage.setItem("arrayAguardando", JSON.stringify(arrayAguardando));
		localStorage.setItem("arrayTratamento", JSON.stringify(arrayTratamento));
		localStorage.setItem("arrayOutros", JSON.stringify(arrayOutros));
		localStorage.setItem("arrayLabel", JSON.stringify(arrayLabel));
		localStorage.setItem("horaQSalvou", horaAgora());
	}
}

async function rederizaOsGraficos(totaisUDI){
	var date = new Date(), minutoAtual = date.getMinutes();
	if(minQRenderizou != minutoAtual){
		pushDeDados(totaisUDI);

		$("body iframe").remove();
		//todosChamadosPie(totaisUDI);
		todosChamadosBarra(totaisUDI);
		montaGraficoIE();
		montaGraficoWMS();
		montaGraficoQlikView();
	//	todosChamadosLine(totaisUDI);
		montaGraficoCamisa10();
		montaGraficoPMcycle();
		montaGraficoModFabril();
		montaGraficoInterAct();
    montaGraficoSegAmbev();
    montaGraficoMES();
		montaGraficoNovoMES();
    montaGraficoTMS();
		montaChamadosBarraSeparados(totaisUDI);

		$('#totalUDI').text(totaisUDI[0]+totaisUDI[1]);

		minQRenderizou = minutoAtual;
	}
}

function descobreOferta(sti, status){
	var ofertaInvetarioEletronico = ["(STI15973)","(STI15974)","(STI15975)","(STI15976)","(STI15977)","(STI15978)","(STI15979)","(STI15980)","(STI4591)","(STI4673)"],
		ofertaWMS                 = ["(STI8053)", "(STI8057)", "(STI8058)", "(STI8061)", "(STI8062)", "(STI8063)", "(STI8066)", "(STI8067)", "(STI8071)", "(STI8072)", "(STI8073)", "(STI8075)", "(STI9649)", "(STI9651)", "(STI9652)", "(STI10250)", "(STI10251)", "(STI10252)", "(STI10259)","(STI11868)","(STI12173)", "(STI12788)", "(STI12789)", "(STI13220)", "(STI13221)", "(STI13222)", "(STI13223)", "(STI8076)", "(STI8077)", "(STI8078)", "(STI8079)", "(STI8211)", "(STI9637)", "(STI9640)", "(STI9641)", "(STI9642)", "(STI9643)", "(STI9645)", "(STI9647)", "(STI9648)", "(STI12177)", "(STI12181)", "(STI13218)", "(STI13219)", "(STI12779)", "(STI12780)", "(STI12781)", "(STI12782)", "(STI12783)", "(STI12784)", "(STI12785)", "(STI12786)", "(STI12787)", "(STI10137)"];
		ofertaQlikView            = ["(STI11854)", "(STI11855)","(STI11856)","(STI11857)","(STI11858)"]
		ofertaCamisa10			  = ["(STI13565)","(STI13566)","(STI13567)"],
		ofertaPMcycle			  = ["(STI13261)","(STI14347)","(STI14348)","(CENG14346)"],
		ofertaModFabril	 	 	  = ["(STI14049)","(STI13990)","(STI13991)","(STI13993)","(STI11981)"],
    ofertaInterAct			  = ["(STI12552)","(STI12551)","(STI12546)","(STI12540)","(STI12559)","(STI12552)"],
    ofertaMES = ["(STI1324)","(STI1519)","(STI1528)","(STI1529)","(STI8106)","(STI12230)","(STI1529)"],
		ofertaNovoMES = ["(STI12156)","(STI12150)","(STI12151)","(STI12155)","(STI12153)","(STI12154)","(STI12152)","(STI12164)","(STI12163)","(STI12166)","(STI12165)","(STI12168)","(STI12162)","(STI12167)","(STI12161)","(STI12157)","(STI12159)","(STI12158)","(STI12160)","(STI15330)"],
    ofertaTMS = ["(STI8207)","(STI7814)","(STI12237)","(STI7816)","(STI7815)","(STI7756)","(STI7755)"],
		ofertaSegAmbev			  = ["(STI11916)","(STI11917)","(STI11918)","(STI11919)","(STI11920)","(STI11921)","(STI11922)","(STI11923)"];

	if(ofertaInvetarioEletronico.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoIE++ : (status == "Em tratamento" ? tratamentoIE++ : "")
		return;
	}else if(ofertaWMS.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoWMS++ : (status == "Em tratamento" ? tratamentoWMS++ : "")
		return;
	}else if(ofertaQlikView.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoQkView++ : (status == "Em tratamento" ? tratamentoQkView++ : "");
		return;
	}else if(ofertaCamisa10.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoCamisa10++ : (status == "Em tratamento" ? tratamentoCamisa10++ : "");
		return;
	}else if(ofertaModFabril.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoModFabril++ : (status == "Em tratamento" ? tratamentoModFabril++ : "");
		return;
	}else if(ofertaInterAct.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoInterAct++ : (status == "Em tratamento" ? tratamentoInterAct++ : "");
		return;
	}else if(ofertaPMcycle.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoPMcycle++ : (status == "Em tratamento" ? tratamentoPMcycle++ : "");
		return;
	}else if(ofertaSegAmbev.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoSegAmbev++ : (status == "Em tratamento" ? tratamentoSegAmbev++ : "");
		return;
	}else if(ofertaMES.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoMES++ : (status == "Em tratamento" ? tratamentoMES++ : "")
		return;
	}else if(ofertaNovoMES.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoNovoMES++ : (status == "Em tratamento" ? tratamentoNovoMES++ : "")
		return;
	}else if(ofertaTMS.indexOf(sti) > -1){
		status == "Aguardando tratamento" ? aguardandoTMS++ : (status == "Em tratamento" ? tratamentoTMS++ : "");
		return;
	}
	return;
}


function calculaTotalChamadosUdi(){
	var totalTratamentoUdi = tratamentoIE + tratamentoWMS + tratamentoQkView + tratamentoCamisa10 + tratamentoModFabril + tratamentoInterAct + tratamentoSegAmbev + tratamentoPMcycle + tratamentoMES + tratamentoNovoMES + tratamentoTMS ;
	var totalAguardandoUDI = aguardandoIE + aguardandoWMS + aguardandoQkView + aguardandoCamisa10 + aguardandoModFabril + aguardandoInterAct + aguardandoSegAmbev + aguardandoPMcycle + aguardandoMES + aguardandoNovoMES + aguardandoTMS;

	return [totalTratamentoUdi,totalAguardandoUDI];
}
