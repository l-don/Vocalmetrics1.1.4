<?php

////////////
// Routes //
////////////

// Flight::route('GET /', 'root');

// UPDATE database (JSON file)
Flight::route('POST /', function(){
	// echo 'hello world!';
	writeToJsonFile(Flight::request());
});

Flight::start();


//////////////
// Handlers //
//////////////

// function root(){
// 	phpinfo();
// };

function writeToJsonFile( $request ){
	
	$file = "../../data/database.json";

	file_put_contents($file, $request->body);

    var_dump($request->body);
};

?>