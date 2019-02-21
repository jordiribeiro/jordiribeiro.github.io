// Inicia o Firebase
var config = {
	apiKey: "AIzaSyDFEmrUz1nClQeqUzsjuxtrPWvukz9qkTk",
	 authDomain: "chamados3-577e6.appspot.com",
	 databaseURL: "https://chamados3-577e6.firebaseio.com/",
	 projectId: "chamados3-577e6",
	 storageBucket: "chamados3-577e6.appspot.com",
	 messagingSenderId: "337145017330"
	};

firebase.initializeApp(config);
var database = firebase.database();
var atualiza = database.ref('chamados/');

// Escuta qualquer atualização no banco e atualiza as informações na tela
atualiza.on('value', function(snapshot){
	atualizaInformacoesNaTelaUDI(snapshot.val());
});
