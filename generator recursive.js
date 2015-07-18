'use strict'

// thanks to Benjamin Gruenbaum (@benjamingr on GitHub) for
// big improvements here!
function run(gen) {
    var args = [].slice.call( arguments, 1), it;

    // initialize the generator in the current context
    it = gen.apply( this, args );

    // return a promise for the generator completing
    return Promise.resolve()
        .then( function handleNext(value){
            // run to the next yielded value
            var next = it.next( value );

            return (function handleResult(next){
                // generator has completed running?
                if (next.done) {
                    return next.value;
                }
                // otherwise keep going
                else {
                    return Promise.resolve( next.value )
                        .then(
                            // resume the async loop on
                            // success, sending the resolved
                            // value back into the generator
                            handleNext,

                            // if `value` is a rejected
                            // promise, propagate error back
                            // into the generator for its own
                            // error handling
                            function handleErr(err) {
                                return Promise.resolve(
                                    it.throw( err )
                                )
                                .then( handleResult );
                            }
                        );
                }
            })(next);
        } );
}



// =============================================

console.clear();



function ajax ( url, opts ) {
  console.log("val:", opts.val);
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    var completed = 4;
    if ( xhr.readyState === completed ) {
      if ( xhr.status === 200 ) {
        opts.success( opts.val );
      } else {
        opts.error( xhr.responseText, xhr );
      }
    }
  };
  xhr.open( opts.method, url, true );
  xhr.send( opts.data );
}



// ajax('http://127.0.0.1:1337', {
//   method: 'GET',
//   success: function(response){
//     console.log("res", response);
//   },
//   error: function(response){
//     console.log(response);
//   }
// });


// Promise-aware ajax
function request(url) {
  return new Promise( function(resolve,reject){
    // the `ajax(..)` callback should be our
    // promise's `resolve(..)` function
    //ajax( url, resolve );
    ajax(url, {
      method: 'GET',
      success: resolve,
      error: reject,
      val: url
    });
  } );
}

request("google.com" ).then(function(result){

})

function *foo(val) {
  var myval = val;
  if (myval > 1) {
    // generator recursion
    val = yield *foo( myval - 1 );
  }

  return yield request( myval );
}

function *bar() {
  var r1 = yield *foo( 3 );
  console.log("bar console:", r1 );
}



run( bar );
