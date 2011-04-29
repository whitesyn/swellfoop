<?php
	error_reporting(E_ALL);
	
	function cmp($a, $b) {
		if ($a['points'] == $b['points']) {
			return 0;
		}
		return ($a['points'] < $b['points']) ? 1 : -1;
	}
	
	class Rating {
	
		const RATING_FILE = 'rating.xml'; 

		private static function cmp ( $a, $b ) {
			if ( $a [ 'points' ] == $b [ 'points' ] ) {
				return 0;
			}
			return ( $a [ 'points' ] < $b[ 'points' ] ) ? 1 : -1;
		}
		public static function getRating() {
			$oXML = simplexml_load_file ( self::RATING_FILE );
			$aItems = array();
			foreach ( $oXML -> item as $oItem ) {
				$aAttrs = $oItem -> attributes();
				$aItem = array();
				$aItem['nickname'] = ( isset($aAttrs['nickname']) ) 
					? (string) $aAttrs['nickname'] 
					: 'Anonymous';
				$aItem['date'] = ( isset($aAttrs['date']) ) 
					? date ('m/d/Y h:i:s', (string) $aAttrs['date']) 
					: '00/00/0000 00:00:00';
				$aItem['points'] = (int)( (string) $oItem );
				$aItems[] = $aItem;
			}
			return $aItems;
		}
		
		public static function getTop($_count = 5 ) {
			$aItems = self::getRating();
			usort($aItems, 'Rating::cmp');
			return array_slice($aItems, 0, $_count);
		}
		
		public static function addRating($_nickname, $_value) {
			$value = (int) $_value;
			$oXML = simplexml_load_file ( self::RATING_FILE );
			$oItem = $oXML -> addChild ( 'item', $_value );
			$oItem -> addAttribute ( 'nickname', (string) $_nickname );
			$oItem -> addAttribute ( 'date', time() );
			$oXML -> asXML ( self::RATING_FILE );
		}
	}
	if ( (isset ( $_SERVER [ 'HTTP_REFERER' ] ) && $_SERVER [ 'HTTP_HOST' ] == parse_url($_SERVER [ 'HTTP_REFERER' ], 1) ) 
		&& (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest' ) ) {
		$action = ( isset ( $_REQUEST [ 'action' ] ) ) ? $_REQUEST [ 'action' ] : '';
		header('Content-type: application/json;');
		switch ($action) {
			case 'getTop':
				$aItåms = Rating::getTop(5);
				echo json_encode($aItåms);
				break;
			case 'add':
				if ( isset ( $_REQUEST [ 'nickname' ] ) && trim($_REQUEST [ 'nickname' ]) != '') {
					$nickname = htmlspecialchars_decode($_REQUEST [ 'nickname' ]);
					$nickname = strip_tags($nickname);
				} else {
					$nickname = 'Anonimous';
				}
				$points = ( isset ( $_REQUEST [ 'points' ] ) )
					? (int) $_REQUEST [ 'points' ]
					: 0;
				$aItåms = Rating::addRating($nickname, $points);
				echo json_encode ( array ( 'message'=> 'Your result has been saved.' ) );
				break;
			default:
				break;;
		}
	}
?>