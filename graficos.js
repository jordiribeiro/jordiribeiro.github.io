// Declaração de Variáveis GLOBAIS
var aguardando,	tratamento,
	outros,
	aguardandoIE, tratamentoIE,
	aguardandoWMS, tratamentoWMS,
	aguardandoQkView, tratamentoQkView,
	aguardandoCamisa10, tratamentoCamisa10,
	aguardandoModFabril, tratamentoModFabril,
	aguardandoInterAct, tratamentoInterAct,
	aguardandoSegAmbev, tratamentoSegAmbev,
	aguardandoMES, tratamentoMES,
	aguardandoNovoMES, tratamentoNovoMES,
	aguardandoTMS, tratamentoTMS,
	aguardandoPMcycle, tratamentoPMcycle;

var minQRenderizou      = 0,
	tamanhoGrafDeLinhas = 500,
	yMax                = 500,
	optionsDefault2     = {},
	proxSave,
	minSalvou,
	passo               = 20; //passo é o intervalo em minutos entre um save e outro do gráfico de linhas

if(localStorage.getItem("arrayAguardando")){
	var arrayAguardando = JSON.parse(localStorage.getItem("arrayAguardando")),
		arrayTratamento = JSON.parse(localStorage.getItem("arrayTratamento")),
		arrayOutros     = JSON.parse(localStorage.getItem("arrayOutros")),
		arrayLabel      = JSON.parse(localStorage.getItem("arrayLabel"));
}else{
	var arrayAguardando = [],
		arrayTratamento = [],
		arrayOutros     = [],
		arrayLabel      = [];
}

var textoTratamento = "Tratamento",
	textoAguardando = "Aguardando",
	textoVencido = "Vencido",
	textoProx = "ProximoVencer",
	textoNaoVenc = "No prazo";

var bgTratamento          = ['rgba(0, 148, 50,1.0)','rgba(0, 148, 50,1.0)'],
	borderTratamento      = ['rgba(32, 191, 107,0.95)','rgba(32, 191, 107,1.0)'],
	bgAguarTratamento     = ['rgba(234, 32, 39,1.0)','rgba(234, 32, 39,1.0)'],
	bgProxVenc						=['rgba(244, 238, 66)','rgba(244, 238, 66)'],
	borderProxVenc			=['rgba(244, 238, 66)','rgba(244, 238, 66)'],
	borderAguarTratamento = ['rgba(235, 59, 90, 1.0)','rgba(235, 59, 90, 1.0)'];
	bgOutros              = ['rgba(154, 236, 219,0.95)','rgba(154, 236, 219,0.95)'],
	borderOutros          = ['rgba(154, 236, 219,1.0)','rgba(154, 236, 219,1.0)'];

var optionsDefault  = {
    scaleBeginAtZero: true,
    responsive: true,
    scaleStartValue : 0,
	tooltips: {
		mode: 'point',
		// mode: 'index',
		intersect: false
    },
	scales: {
		xAxes: [{
            ticks: {
                beginAtZero: true,
				min: 0,
				weight: 1,
            },
			scaleLabel: {
                display: false,
                labelString: 'Situação'
            },
			stacked: true
        }],
		yAxes: [{
            ticks: {
                beginAtZero: true,
				min: 0
            },
			stacked: true
        }]
    },
	borderWidth: 1
};

function setaOptionsDefault2(){
	optionsDefault2  = {
	    scaleBeginAtZero: true,
	    responsive: true,
	    scaleStartValue : 0,
		tooltips: {
	            mode: 'point'
	    },
		scales: {
			xAxes: [{
				stacked: true,
				ticks: {
	                beginAtZero: true,
					min: 0,
					weight: 1,
	            }
			}],
			yAxes: [{
				stacked: true,
				ticks: {
	                beginAtZero: true,
					min: 0,
					max: yMax,
					steps: 10
	            }
			}]
		},


		borderWidth: 1
	};
}

function setaOptionsDefault3(){
	optionsDefault3  = {
	    scaleBeginAtZero: true,
	    responsive: true,
	    scaleStartValue : 0,
		tooltips: {
	            mode: 'point'
	    },
		scales: {
			xAxes: [{
				stacked: true,
				ticks: {
          beginAtZero: true,
					min: 0,
					weight: 1,
            }
			}],
			yAxes: [{
				stacked: true,
				ticks: {
          beginAtZero: true,
					min: 0,
					max: yMax,
					steps: 10
          }
			}]
		},
			borderWidth: 1
	};
}
// function todosChamadosPie(totaisUDI){
// 	var chamadosPie = document.getElementById('chamadosPie').getContext('2d');
// 	var todosChamadosPie = new Chart(chamadosPie, {
// 		type: 'pie',
// 		data: {
// 			labels: ["Em tratamento" , "Aguardando atendimento"],
// 			datasets: [
// 				{
// 					backgroundColor: ['rgba(0, 148, 50,1.0)','rgba(234, 32, 39,1.0)'],
// 					borderColor: ['#fff','#fff'],
// 					data: [totaisUDI[0], totaisUDI[1]]
// 				}
// 			]
// 		},
// 		options: {}
// 	});
// }

function todosChamadosBarra(totaisUDI){
		var chamadosBarra = document.getElementById('chamadosBarra').getContext('2d');
		var todosChamadosBarra = new Chart(chamadosBarra, {
			    type: 'bar',
			    data: {
						labels: [ totaisUDI[0] + "", totaisUDI[1] + ""],
						datasets: [
								{
										label: textoTratamento,
										backgroundColor: bgTratamento,
										borderColor: borderTratamento,
										fill: false,
										data: [totaisUDI[0], 0]
									},
									{
											label: textoAguardando,
											backgroundColor: bgAguarTratamento,
											borderColor: borderAguarTratamento,
											fill: false,
											data: [0 ,totaisUDI[1]]
										}
									]
								},
							    options: optionsDefault
							});
						}


// function todosChamadosLine(totaisUDI){
// 	var chamadosLine = document.getElementById('chamadosLine').getContext('2d');
// 	var todosChamadosLine = new Chart(chamadosLine, {
// 	    type: 'line',
// 	    data: {
// 			labels: arrayLabel,
// 			datasets: [
// 				{
// 					label: textoTratamento,
// 					backgroundColor: bgTratamento,
// 					borderColor: borderTratamento,
// 					fill: false,
// 					data: arrayTratamento
// 				},
// 				{
// 					label: textoAguardando,
// 					backgroundColor: bgAguarTratamento,
// 					borderColor: borderAguarTratamento,
// 					fill: false,
// 					data: arrayAguardando
// 				}
// 			]
// 		},
// 	    options: {
// 		    scaleBeginAtZero: true,
// 		    responsive: true,
// 		    scaleStartValue : 0,
// 			tooltips: {
// 				mode: 'point',
// 				// mode: 'index',
// 				intersect: false
// 		    },
// 			scales: {
// 				xAxes: [{
// 		            ticks: {
// 		                beginAtZero: true,
// 						min: 0,
// 						weight: 1,
// 		            },
// 					scaleLabel: {
// 		                display: false,
// 		                labelString: 'Situação'
// 		            },
// 					stacked: true
// 		        }],
// 				yAxes: [{
// 		            ticks: {
// 		                beginAtZero: true,
// 						min: 0
// 		            },
// 					stacked: false
// 		        }]
// 		    },
// 			borderWidth: 1
// 		}
// 	});
// }

function montaGraficoIE(){
	var divGraficoIE = document.getElementById('graficoIE').getContext('2d');
	var optionsIE = {
	    scaleBeginAtZero: true,
	    responsive: true,
	    scaleStartValue : 0
	};
	var graficoIE = new Chart(divGraficoIE, {
	    type: 'bar',
	    data: {
			labels: [tratamentoIE + "", aguardandoIE + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoIE, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoIE],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoWMS(){
	var divGraficoWMS = document.getElementById('graficoWMS').getContext('2d');
	var graficoWMS = new Chart(divGraficoWMS, {
	    type: 'bar',
	    data: {
			labels: [tratamentoWMS + "", aguardandoWMS + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoWMS, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoWMS],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoQlikView(){
	var divGraficoQlikView = document.getElementById('graficoQlikView').getContext('2d');
	var graficoQlikView = new Chart(divGraficoQlikView, {
	    type: 'bar',
	    data: {
			labels: [tratamentoQkView + "" , aguardandoQkView + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoQkView, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoQkView],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaChamadosBarraSeparados(totaisUDI){
	var chamadosBarraSeparados = document.getElementById('chamadosBarraSeparados').getContext('2d');
	var graficoBarraSepardos = new Chart(chamadosBarraSeparados, {
	    type: 'bar',
	    data: {
			labels: [totaisUDI[0] + "", totaisUDI[1] + ""],
			datasets: [{
				label: 'Inventário E.',
				backgroundColor: ['rgb(156, 39, 176)','rgb(156, 39, 176)'],
				stack: 'Stack 0',
				data: [tratamentoIE,aguardandoIE]
			}, {
				label: 'WMS',
				backgroundColor: ['rgb(103, 58, 183)','rgb(103, 58, 183)'],
				stack: 'Stack 0',
				data: [tratamentoWMS,aguardandoWMS]
			}, {
				label: 'QlikView',
				backgroundColor: ['rgb(233, 30, 99)','rgb(233, 30, 99)'],
				stack: 'Stack 0',
				data: [tratamentoQkView,aguardandoQkView]
			}, {
				label: 'Camisa10',
				backgroundColor: ['rgb(139, 195, 74)','rgb(139, 195, 74)'],
				stack: 'Stack 0',
				data: [tratamentoCamisa10, aguardandoCamisa10]
			}, {
				label: 'InterAct',
				backgroundColor: ['rgb(0, 150, 136)','rgb(0, 150, 136)'],
				stack: 'Stack 0',
				data: [tratamentoInterAct, aguardandoInterAct]
			}, {
				label: 'PMCycle',
				backgroundColor: ['rgb(255, 87, 34)','rgb(255, 87, 34)'],
				stack: 'Stack 0',
				data: [tratamentoPMcycle, aguardandoPMcycle]
			}, {
				label: 'Mod.Fabril',
				backgroundColor: ['rgb(205, 220, 57)','rgb(205, 220, 57)'],
				stack: 'Stack 0',
				data: [tratamentoModFabril, aguardandoModFabril]
			}
		]

		},
		options: {
			tooltips: {
				mode: 'index',
				intersect: false
			},
			responsive: true,
			scales: {
				xAxes: [{
					stacked: true,
				}],
				yAxes: [{
					stacked: true
				}]
			}
		}
	});
}


function montaGraficoCamisa10(){
	var divGraficoCamisa10 = document.getElementById('graficoCamisa10').getContext('2d');
	var graficoCamisa10 = new Chart(divGraficoCamisa10, {
	    type: 'bar',
	    data: {
			labels: [tratamentoCamisa10 + "" , aguardandoCamisa10 + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoCamisa10, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoCamisa10],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoPMcycle(){
	var divGraficoPMcycle = document.getElementById('graficoPMcycle').getContext('2d');
	var graficoPMcycle = new Chart(divGraficoPMcycle, {
	    type: 'bar',
	    data: {
			labels: [tratamentoPMcycle + "" , aguardandoPMcycle + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoPMcycle, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoPMcycle],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoModFabril(){
	var divGraficoModFabril = document.getElementById('graficoModFabril').getContext('2d');
	var graficoModFabril = new Chart(divGraficoModFabril, {
	    type: 'bar',
	    data: {
			labels: [tratamentoModFabril + "" , aguardandoModFabril + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoModFabril, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoModFabril],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoInterAct(){
	var divGraficoInterAct = document.getElementById('graficoInterAct').getContext('2d');
	var graficoInterAct = new Chart(divGraficoInterAct, {
	    type: 'bar',
	    data: {
			labels: [ tratamentoInterAct + "", aguardandoInterAct + "" ],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoInterAct,0]
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoInterAct]
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoSegAmbev(){
	var divGraficoSegAmbev = document.getElementById('graficoSegAmbev').getContext('2d');
	var graficoSegAmbev = new Chart(divGraficoSegAmbev, {
	    type: 'bar',
	    data: {
			labels: [ tratamentoSegAmbev + "", aguardandoSegAmbev + "" ],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoSegAmbev,0]
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoSegAmbev]
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoMES(){
	var divGrafico = document.getElementById('graficoMES').getContext('2d');
	var graficoMES = new Chart(divGrafico, {
	    type: 'bar',
	    data: {
			labels: [tratamentoMES + "", aguardandoMES + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoMES, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoMES],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoNovoMES(){
	var divGrafico = document.getElementById('graficoNovoMES').getContext('2d');
	var graficoNovoMES = new Chart(divGrafico, {
	    type: 'bar',
	    data: {
			labels: [tratamentoNovoMES + "", aguardandoNovoMES + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoNovoMES, 0],
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoNovoMES],
				}
			]
		},
	    options: optionsDefault2
	});
}

function montaGraficoTMS(){
	var divGrafico = document.getElementById('graficoTMS').getContext('2d');
	var graficoTMS = new Chart(divGrafico, {
	    type: 'bar',
	    data: {
			labels: [tratamentoTMS + "" , aguardandoTMS + ""],
			datasets: [
				{
					label: textoTratamento,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [tratamentoTMS, 0]
				},
				{
					label: textoAguardando,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [0, aguardandoTMS]
				}
			]
		},
	    options: optionsDefault2
	});
}
/*function montaGraficoStatus(){
	var divGrafico = document.getElementById('graficoStatus').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
	    type: 'bar',
	    data: {
			labels: [vencido + "" , proximovencer + "" , naovencido +""],
			datasets: [
				{
					label: textoVencido,
					backgroundColor: bgAguarTratamento,
					borderColor: borderAguarTratamento,
					data: [vencido, 0 ,0]
				},
				{
					label: textoProx,
					backgroundColor: bgProxVenc,
					borderColor: borderProxVenc,
					data: [0, proximovencer]
				},
				{
					label: textoNaoVenc,
					backgroundColor: bgTratamento,
					borderColor: borderTratamento,
					data: [0,naovencido]
				}
			]
		},
	    options: optionsDefault2
	});
}*/

function montaGraficoStatus(){
	var divGrafico = document.getElementById('graficoStatus').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencido, naovencido , proximovencer]}	]
		},
		options: {}
	});
}
function montaGraficoStatusIAL(){
	var divGrafico = document.getElementById('graficoStatusIAL').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidointeract, naovencidointeract , proximovencerinteract]}	]
		},
		options: {}
	});
}
function montaGraficoStatusCamisa10(){
	var divGrafico = document.getElementById('graficoStatusCamisa10').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidocamisa10, naovencidocamisa10 , proximovencercamisa10]}	]
		},
		options: {}
	});
}
function montaGraficoinventarioEle(){
	var divGrafico = document.getElementById('graficoStatusinventarioEle').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidoinventarioEle, naovencidoinventarioEle , proximovencerinventarioEle]}	]
		},
		options: {}
	});
}
function montaGraficowmsfab(){
	var divGrafico = document.getElementById('graficoStatuswmsfab').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidowmsfab, naovencidowmsfab ,proximovencerwmsfab,]}	]
		},
		options: {}
	});
}
function montaGraficoqlick(){
	var divGrafico = document.getElementById('graficoStatusqlick').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidoqlick , proximovencerqlick , naovencidoqlick]}	]
		},
		options: {}
	});
}

function montaGraficopm(){
	var divGrafico = document.getElementById('graficoStatuspmcycle').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidopmcycle , proximovencerpmcycle , naovencidopmcycle]}	]
		},
		options: {}
	});
}
function montaGrafimofab(){
	var divGrafico = document.getElementById('graficoStatusmofab').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidomofab , proximovencermofab , naovencidomofab]}	]
		},
		options: {}
	});
}

function montaGraficosegamb(){
	var divGrafico = document.getElementById('graficoStatussegamb').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidosegamb , proximovencersegamb , naovencidosegamb ]}	]
		},
		options: {}
	});
}

function montaGraficomesleg(){
	var divGrafico = document.getElementById('graficoStatusmesleg').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidomesleg , proximovencermesleg , naovencidomesleg]}	]
		},
		options: {}
	});
}

function montaGraficonovmes(){
	var divGrafico = document.getElementById('graficoStatusnovmes').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidonovmes , proximovencernovmes , naovencidonovmes]}	]
		},
		options: {}
	});
}

function montaGraficostattms(){
	var divGrafico = document.getElementById('graficoStatustms').getContext('2d');
	var graficoStatus = new Chart(divGrafico, {
		type: 'pie',
		data: {
			labels: ["Vencido" , "Não vencido", "Proximo vencer"],
			datasets: [	{backgroundColor: ['rgba(234, 32, 39,1.0)','rgba(0, 148, 50,1.0)','rgba(244, 238, 66)'],
					borderColor: ['#fff','#fff','#fff'],
					data: [vencidotms , proximovencertms , naovencidotms ]}	]
		},
		options: {}
	});
}
function montarGraficoSegundaTela(){

	var outrosOutrosSis=proximovencercamisa10+proximovencerpmcycle+proximovencermofab+proximovencersegamb;
	var tempMES=proximovencermesleg+proximovencernovmes;
	var divGrafico = document.getElementById('graficoTela2');
	var graficoStatus = new Chart(divGrafico, {
	type: 'horizontalBar',
    data: {
      labels: ["MES","TMS","Inventario Ele.","QLICK","IAL","WMS Fabrica","Outros Sistemas"],
      datasets:[{
          label: "Quantidade Chamados",
          backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
          data: [tempMES,proximovencertms,proximovencerinventarioEle,proximovencerqlick,proximovencerinteract,proximovencerwmsfab,outrosOutrosSis]  }]
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Chamados Perto de vencimento'
      }
    }
});
}
