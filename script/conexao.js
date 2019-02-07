// Inicia o Firebase
var config = {
	apiKey           : "AIzaSyAMA5UgGqHK0vX-g35dihenHR15gNd_6t0",
	authDomain       : "teste-2307.firebaseapp.com",
	databaseURL      : "https://teste-2307.firebaseio.com",
	projectId        : "teste-2307",
	storageBucket    : "teste-2307.appspot.com",
	messagingSenderId: "909861439013"
};

firebase.initializeApp(config);
var database = firebase.database();
var atualiza = database.ref('chamados/');

// Escuta qualquer atualização no banco e atualiza as informações na tela
atualiza.on('value', function(snapshot){
	atualizaInformacoesNaTelaUDI(snapshot.val());
});
