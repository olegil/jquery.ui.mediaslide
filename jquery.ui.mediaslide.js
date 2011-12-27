

(function( $ ) {
$.widget( "ui.mediaslide", {
	// These options will be used as defaults
	options: { 
		"atom_xml_data": null,
		"atom_xml_ajax": null,
		"json_data": null,
		"json_ajax": null,
		"start_position": 0,
		"thumbs_visible": true,
		"num_thumbs": 5,
		"thumb_width": 200,
		"thumb_spacing": 5
	},

	// Set up the widget
	_create: function() {
		this.setup = false;
		this.html_setup = false;
		this.slide_in_progress = false;
		this.position=this.options.start_position;
		this.pframe_displaying=1;
		this._init_data();
	},
	_init_data: function() { 
		o=this;
		if (this.options.atom_xml_data != null) { 
			this.dataType='atom';
			if (typeof(this.options.atom_xml_data)=='string') { 
				this.data=jQuery.parseXML(this.options.atom_xml_data);
			} else { 
				this.data=this.options.atom_xml_data;
			}
			this._init_display();
		} else if (this.options.atom_xml_ajax != null) { 
			if (typeof(this.options.atom_xml_ajax)!='string') { 
				jQuery.ajax(this.options.atom_xml_ajax.url,{data: this.options.atom_xml_ajax.options, success: function(data) { 
					o.data=jQuery(data);
					o.dataType='atom';
					o._init_display();
				}, error: function(j,t,e) { 
					console.log(t);
				}});
			} else { 
				jQuery.ajax(this.options.atom_xml_ajax,{success: function(data) { 
					o.data=jQuery(data);
					o.dataType='atom';
					o._init_display();
				}, error: function(j,t,e) { 
					console.log(t);
				}});
			}
		} else if (this.options.json_data!= null) { 
			this.dataType='json';
			if (typeof(this.options.json_data)=='string') { 
				this.data=jQuery.parseJSON(this.options.json_data);
			} else { 
				this.data=this.options.json_data;
			}
			this._init_display();
		} else if (this.options.json_ajax != null) { 
			if (typeof(this.options.json_ajax)!='string') { 
				jQuery.getJSON(this.options.json_ajax.url,{data: this.options.json_ajax.options, success: function(data) { 
					o.data=jQuery(data);
					o.dataType='json';
					o._init_display();
				}, error: function (j,t,e) { 
					console.log(t);
				}});
			} else { 
				jQuery.getJSON(this.options.json_ajax,{success: function(data) { 
					o.data=jQuery(data);
					o.dataType='json';
					o._init_display();
				}, error: function (j,t,e) { 
					console.log(t);
				}});
			}
		} else {
			console.log('No data specified.');
		}
	},
	_init_display: function() { 
		if (!this.html_setup) { 
			this._do_html_setup();
			this.pframe_displaying=1;
		}
		this._parse_data();
		this.position_skip(this.position);
		this.setup=true;
	},
	_parse_data: function() { 
		var d=new Array();
		if (this.dataType=='atom') { 
			this.data.find('entry').each(function(i,ob) { 
				var normal=null;
				var thumb=null;
				jQuery(ob).find('link').each(function (o,lob) { 
					if (jQuery(lob).attr('title')=='normal') { 
						normal=jQuery(lob).attr('href');
					} else if (jQuery(lob).attr('title')=='thumb') { 
						thumb=jQuery(lob).attr('href');
					}
				});
				d.push({
					title: jQuery(ob).find('title').text(),
					link: jQuery(ob).find('link').attr('href'),
					id: jQuery(ob).find('id').text(),
					updated: jQuery(ob).find('updated').text(),
					normal: normal,
					thumb: thumb
				});
			});
			this.d=d;
		} else if (this.dataType=='json') { 

		} else {
			console.log('unknown data type');
		}
		this._do_thumbnail_html_setup();
	},
	_do_thumbnail_html_setup: function() { 
		this.thumbnails=new Array();
		var l = this.thumbnails;
		var t = this.thumbslide_content;
		t.html('');
		var op = this.options;
		var me = this;
		jQuery.each(this.d,function(i,o) { 
			var p=jQuery('<div></div>')	.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-thumb-div')
							.css({'float': 'left', 'position': 'relative', 'width': op.thumb_width, 'margin-left': me._get_left_thumb_spacing(),'margin-right': me._get_right_thumb_spacing(), 'text-align': 'center' })
							.html('<img class="ui-widget-mediaslide-thumb-img">')
							.appendTo(t);
			l.push(p);

		});
		this.thumbslide.width(this._get_visible_scrollbox_width());
		this.thumbslide_content.width(this._get_total_scrollbox_width());


		//scrollpane parts
		var scrollPane = this.thumbslide, scrollContent = this.thumbslide_content;
		
		//build slider
		this.scrollbar = this.thumbslide_slider.slider({step: 0.1,
			slide: function( event, ui ) {
				if ( scrollContent.width() > scrollPane.width() ) {
					scrollContent.css( "margin-left", Math.round(
						ui.value / 100 * ( scrollPane.width() - scrollContent.width() )
					) + "px" );
				} else {
					scrollContent.css( "margin-left", 0 );
				}
			},
			change: function(event, ui) {
				alert(me._get_scroll_position_estimate(ui.value));
			}
		});
		var sb=this.scrollbar;
		//append icon to handle
		this.handleHelper = this.scrollbar.find( ".ui-slider-handle" )
		.css({'top': '-1px','height': '0.8em'})
		.mousedown(function() {
			sb.width( handleHelper.width() );
		})
		.mouseup(function() {
			sb.width( "100%" );
		})
		.append( "<span class='ui-icon ui-icon-grip-dotted-vertical'></span>" )
		.wrap( jQuery("<div></div>" ).css({ 'position': 'relative', width: '100%', height: '100%', margin: '0 auto' })).parent();
		//change overflow to hidden now that slider handles the scrolling

		scrollPane.css( "overflow", "hidden" );
		this._size_scrollbar();	
		this._do_thumbnail_image_loads();
	},
	_size_scrollbar: function() { 
		var scrollPane = this.thumbslide, scrollContent = this.thumbslide_content;
		var remainder = scrollContent.width() - scrollPane.width();
		var proportion = remainder / scrollContent.width();
		var handleSize = scrollPane.width() - ( proportion * scrollPane.width() );
		this.scrollbar.find( ".ui-slider-handle" ).css({
			width: handleSize,
			"margin-left": -handleSize / 2
		});
		this.handleHelper.width( "" ).width( this.scrollbar.width() - handleSize );
	},
	_do_thumbnail_image_loads: function(pos) { 
		var l=this.thumbnails;
		var t=this.thumbslide_content;
		var d=this.d;
		for (var i=this._get_first_preload_thumb_position(pos);i<=this._get_last_preload_thumb_position(pos);i++) { 
			l[i].find('.ui-widget-mediaslide-thumb-img').attr('src',d[i].thumb);
		}
	},
	_handle_thumb_slide: function(oldpos) { 
		

		this._do_thumbnail_image_loads();
	},
	_do_html_setup: function() { 
		// setup element HTML here
		this.element.html('');
		this.mainpicture=jQuery('<div></div>')	.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-main-picture-div')
							.css({position: 'relative', overflow: 'hidden'})
							.prependTo(this.element);
		this.pictureframe1=jQuery('<div></div>').addClass('ui-widget')
							.addClass('ui-widget-mediaslide-pictureframe')
							.addClass('ui-widget-mediaslide-pictureframe1')
							.css({position: 'absolute', 'top': '0px', 'left': '0px'})
							.appendTo(this.mainpicture);
		this.pictureframe2=jQuery('<div></div>').addClass('ui-widget')
							.addClass('ui-widget-mediaslide-pictureframe')
							.addClass('ui-widget-mediaslide-pictureframe2')
							.css({position: 'absolute', 'top': '0px', 'left': '0px', 'opacity': '0'})
							.appendTo(this.mainpicture);
		this.thumbslide=jQuery('<div></div>')	.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-thumbslide')
							.css({'overflow': 'auto'})
							.appendTo(this.element);
		this.thumbslide_content=jQuery('<div></div>')
							.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-thumbslide-content')
							.appendTo(this.thumbslide);
		this.thumbslide_scrollbar=jQuery('<div></div>')
							.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-thumbslide-scrollbar')
							.appendTo(this.thumbslide);
		this.thumbslide_slider=jQuery('<div></div>')
							.addClass('ui-widget')
							.addClass('ui-widget-mediaslide-thumbslide-slider')
							.appendTo(this.thumbslide_scrollbar);
		this.html_setup=true;
	},
	_get_scroll_position_estimate: function(pcent) { 
		var dec=pcent/100;
		return (this.d.length-1)*dec;
	},
	_get_foreground_pframe: function() { 
		if (this.pframe_displaying==1) { 
			return this.pictureframe1;
		} else { 
			return this.pictureframe2;
		}
	},
	_get_background_pframe: function() { 
		if (this.pframe_displaying==1) { 
			return this.pictureframe2;
		} else { 
			return this.pictureframe1;
		}
	},
	_get_total_scrollbox_width: function() { 
		var width=(this.d.length-1)*this.options.thumb_width;
		width+=this.options.thumb_spacing*(this.d.length-1);
		return width;
	},
	_get_visible_scrollbox_width: function() { 
		var width=this.options.num_thumbs*this.options.thumb_width;
		width+=this.options.thumb_spacing*this.options.num_thumbs;
		return width;
	},
	_toggle_pframe: function() { 
		if (this.pframe_displaying==1) { 
			this.pframe_displaying=2;
		} else { 
			this.pframe_displaying=1;
		}
	},
	_get_left_thumb_spacing: function() { 
		var pad=Math.floor(this.options.thumb_spacing/2);
		if (this.options.thumb_spacing % 2 != 0) { 
			pad++;
		}
		return pad;
	},
	_get_right_thumb_spacing: function() { 
		return Math.floor(this.options.thumb_spacing/2);
	},
	_get_first_preload_thumb_position: function(pos) { 
		var ret=this._get_first_thumb_position(pos);
		if (ret-1<0) { 
			return 0;
		} else { 
			return ret-1;
		}
	},
	_get_last_preload_thumb_position: function(pos) { 
		var ret=this._get_last_thumb_position(pos);
		if (ret+1>this.d.length-1) { 
			return this.d.length-1;
		} else { 
			return ret+1;
		}
	},
	_get_first_thumb_position: function(pos) { 
		var position=this.position;
		if (typeof(pos)!='undefined') { 
			position=pos;
		}
		var halfthumbs=Math.floor(this.options.num_thumbs/2);
		var otherhalfthumbs=halfthumbs;
		if (this.options.num_thumbs % 2 != 0) { 
			otherhalfthumbs++;
		}
		var end_position=position+otherhalfthumbs;
		if (end_position > this.d.length-1) { 
			halfthumbs+=end_position-(this.d.length-1)
		}
		var first_position=position-halfthumbs;
		if (first_position<0) { 
			return 0;
		} else { 
			return first_position;
		}
	},
	_get_last_thumb_position: function(pos) { 
		var position=this.position;
		if (typeof(pos)!='undefined') { 
			position=pos;	
		}
		var halfthumbs=Math.floor(this.options.num_thumbs/2);
		var otherhalfthumbs=halfthumbs;
		if (this.options.num_thumbs % 2 != 0) { 
			halfthumbs++;
		}
		var first_position=position-otherhalfthumbs;
		if (first_position < 0) { 
			halfthumbs+=0-first_position;
		}
		var end_position=position+halfthumbs;
		if (end_position>this.d.length-1) { 
			return this.d.length-1;
		} else {
			return end_position;
		}
		return halfthumbs;
	},
	// Skips (without sliding) to a specific image number
	position_skip: function(pos) { 
		var frame=this._get_foreground_pframe();
		jQuery(frame).html('<img class="ui-widget-mediaslide-active-img">').find('.ui-widget-mediaslide-active-img').attr('src',this.d[pos].normal);
		this.mainpicture.width(jQuery(frame).width());
		this.mainpicture.height(jQuery(frame).height());
		this.thumbnails[this.position].hide();
		this.position=pos;
	},
	// Slides forwards or backwards a number of positions
	position_slide: function (offset) { 
		if (this.position+offset<0) { 
			console.log('Mediaslide: Tried to skip past the beginning');
			return false;
		}
		if (this.position+offset>this.d.length-1) { 
			console.log('Mediaslide: Tried to skip past the end');
			return false;
		}
		if (offset==0) { 
			console.log('Mediaslide: Tried to move 0 spaces');
		}
		if (this.slide_in_progress) { 
			console.log('Mediaslide: Slide already in progress');
			return false;
		}
		this.slide_in_progress = true;
		var oldpos=this.position;
		this.position=this.position+offset;
		var tob=this;
		var active_frame = this._get_foreground_pframe();
		var inactive_frame = this._get_background_pframe();
		jQuery(active_frame).css({'z-index': 1});
		jQuery(inactive_frame).css({'z-index': 2}).html('<img class="ui-widget-mediaslide-active-img">').find('.ui-widget-mediaslide-active-img').attr('src',this.d[this.position].normal);
		jQuery(inactive_frame).find('.ui-widget-mediaslide-active-img').bind("load", function() { 
			if (tob.mainpicture.height()!=jQuery(inactive_frame).height() || tob.mainpicture.width()!=jQuery(inactive_frame).width()) { 
				jQuery(tob.mainpicture).animate({height: jQuery(inactive_frame).height(), width: jQuery(inactive_frame).width()},'fast');
			}
			jQuery(inactive_frame).fadeTo('slow', 1.0, 'linear', function() { 
				tob._toggle_pframe();
				jQuery(active_frame).css({opacity: 0}).hide();
				tob.slide_in_progress=false;
			});
			tob._handle_thumb_slide(oldpos);
		});
		//alert('slide: '+offset.toString());	
	},
	position_slide_to: function(pos) { 
		this.position_slide(pos-this.position);
	},
	next: function() { 
		this.position_slide(1);
	},
	previous: function() { 
		this.position_slide(-1);
	},
	forward: function (num) { 
		this.position_slide(num);
	},
	backward: function (num) { 
		this.position_slide(0-num);
	},
	first: function() { 
		this.position_slide_to(0);
	},
	last: function() { 
		this.position_slide_to(this.d.length-1);
	},
	get_position: function() { 
		return this.position;
	},
	get_count: function() { 
		return this.d.length;
	},
	get_current_title: function() { 
		return this.d[this.position].title;	
	},
	// Use the _setOption method to respond to changes to options
	_setOption: function( key, value ) {
		switch( key ) {
			case "atom_xml_data":
			case "atom_xml_ajax":
			case "json_data":
			case "json_ajax":
				this._init_data();
				break;
		}
		 
		// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
		$.Widget.prototype._setOption.apply( this, arguments );

	},
 
	// Use the destroy method to clean up any modifications your widget has made to the DOM
	destroy: function() {
		$.Widget.prototype.destroy.call( this );
	}
});
}(jQuery));
