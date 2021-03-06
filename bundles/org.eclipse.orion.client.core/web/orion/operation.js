/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global console define setTimeout XMLHttpRequest*/

/**
 * @name orion.operation
 * @namespace Provides a API for handling long running operations as Deferred
 */
define(["orion/xhr", "orion/Deferred"],  function(xhr, Deferred) {

	function _isRunning(operationType){
		if(!operationType)
			return true;
		if(operationType==="loadstart" || operationType==="progress"){
			return true;
		}
		return false;
	}
	
	function _deleteTempOperation(operationLocation){
		xhr("DELETE", operationLocation, {
			headers: {
				"Orion-Version": "1"
			},
			timeout: 15000
		});
	}

	function _getOperation(operationLocation, deferred) {
		xhr("GET", operationLocation, {
			headers: {
				"Orion-Version": "1"
			},
			timeout: 15000
		}).then(function(result) {
			var operationJson = result.response ? JSON.parse(result.response) : null;
			if(_isRunning(operationJson.type)){
				deferred.progress(operationJson);
				setTimeout(function(){
					_getOperation(operationLocation, deferred);
				}, 2000);
				return;
			}
			if(operationJson.type=="error"){
				deferred.reject(operationJson.Result);
			} else {
				deferred.resolve(operationJson.Result.JsonData);
			}
			if(!operationJson.Location){
				_deleteTempOperation(operationLocation); //This operation should not be kept 
			}
		}, function(error){
			var errorMessage = error;
			if(error.responseText){
				errorMessage = error.responseText;
				try{
					errorMessage = JSON.parse(error.responseText);
				}catch(e){
					//ignore
				}
			}
			if(errorMessage.Message)
				deferred.reject(errorMessage);
			else
				deferred.reject({Severity: "Error", Message: error});
		});
	}
	function handle(operationLocation){
		var def = new Deferred();
		_getOperation(operationLocation, def);
		return def;
	}
	
	return {handle: handle};
});