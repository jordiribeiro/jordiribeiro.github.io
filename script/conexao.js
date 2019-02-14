// Inicia o Firebase
var config = {
				apiKey: "AIzaSyAacioXp-5WZM3LPvxaKoKZvs-vNdCQe0M",
                authDomain: "chamados2-d8f32.appspot.com",
                databaseURL: "https://chamados2-d8f32.firebaseio.com/",
                projectId: "chamados2-d8f32",
                storageBucket: "chamados2-d8f32.appspot.com",
                messagingSenderId: "90332921535"};

firebase.initializeApp(config);
var database = firebase.database();
var atualiza = database.ref('chamados/');

// Escuta qualquer atualização no banco e atualiza as informações na tela
atualiza.on('value', function(snapshot){
	atualizaInformacoesNaTelaUDI(snapshot.val());
});
