
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                const { on_mount } = this.$$;
                this.$$.on_disconnect = on_mount.map(run).filter(is_function);
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            disconnectedCallback() {
                run_all(this.$$.on_disconnect);
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    var options = {
        extractImageUrl: (siteurl, htmlImgTag) => {
            var imageUrl = htmlImgTag.substring(htmlImgTag.indexOf('src="') + 5, htmlImgTag.indexOf('" style'));
            return `${siteurl}${imageUrl}`;
        },
        headers: {
            'Accept': 'application/json;odata=verbose',
        }
    };

    /* src\components\slider.svelte generated by Svelte v3.43.1 */

    const { console: console_1 } = globals;
    const file$5 = "src\\components\\slider.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (39:8) {#each slides as _, index}
    function create_each_block_1(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[13](/*index*/ ctx[20]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot");
    			set_style(div, "width", (/*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? 60 : 30) + "px");
    			add_location(div, file$5, 39, 8, 1429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*activeIndex*/ 16) {
    				set_style(div, "width", (/*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? 60 : 30) + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(39:8) {#each slides as _, index}",
    		ctx
    	});

    	return block;
    }

    // (45:12) {#if slide.Title || slide.Subtitle}
    function create_if_block$3(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*slide*/ ctx[18].Title && create_if_block_2(ctx);
    	let if_block1 = /*slide*/ ctx[18].Subtitle && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file$5, 45, 12, 1877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*slide*/ ctx[18].Title) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*slide*/ ctx[18].Subtitle) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(45:12) {#if slide.Title || slide.Subtitle}",
    		ctx
    	});

    	return block;
    }

    // (47:16) {#if slide.Title}
    function create_if_block_2(ctx) {
    	let h1;
    	let t_value = /*slide*/ ctx[18].Title + "";
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(t_value);
    			add_location(h1, file$5, 46, 33, 1933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*slides*/ 8 && t_value !== (t_value = /*slide*/ ctx[18].Title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(47:16) {#if slide.Title}",
    		ctx
    	});

    	return block;
    }

    // (48:16) {#if slide.Subtitle}
    function create_if_block_1$1(ctx) {
    	let h3;
    	let t_value = /*slide*/ ctx[18].Subtitle + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			add_location(h3, file$5, 47, 36, 1998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*slides*/ 8 && t_value !== (t_value = /*slide*/ ctx[18].Subtitle + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(48:16) {#if slide.Subtitle}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each slides as slide, index}
    function create_each_block$3(ctx) {
    	let a;
    	let a_href_value;
    	let if_block = (/*slide*/ ctx[18].Title || /*slide*/ ctx[18].Subtitle) && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block) if_block.c();
    			attr_dev(a, "href", a_href_value = /*slide*/ ctx[18].Url?.Url);
    			attr_dev(a, "class", "slide");
    			set_style(a, "background-image", "url('" + `${/*siteurl*/ ctx[0]}${/*slide*/ ctx[18].FileRef}` + "')");
    			set_style(a, "z-index", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			set_style(a, "opacity", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			add_location(a, file$5, 43, 8, 1619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block) if_block.m(a, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*slide*/ ctx[18].Title || /*slide*/ ctx[18].Subtitle) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(a, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*slides*/ 8 && a_href_value !== (a_href_value = /*slide*/ ctx[18].Url?.Url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*siteurl, slides*/ 9) {
    				set_style(a, "background-image", "url('" + `${/*siteurl*/ ctx[0]}${/*slide*/ ctx[18].FileRef}` + "')");
    			}

    			if (dirty & /*activeIndex*/ 16) {
    				set_style(a, "z-index", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			}

    			if (dirty & /*activeIndex*/ 16) {
    				set_style(a, "opacity", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(43:4) {#each slides as slide, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let div2_class_value;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*slides*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*slides*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			this.c = noop;
    			attr_dev(div0, "class", "dots");
    			set_style(div0, "top", (/*height*/ ctx[2] || 400) - 50 + "px");
    			add_location(div0, file$5, 37, 4, 1326);
    			set_style(div1, "clear", "both");
    			add_location(div1, file$5, 52, 4, 2100);
    			attr_dev(div2, "class", div2_class_value = "slider " + /*dir*/ ctx[1]);
    			attr_dev(div2, "dir", /*dir*/ ctx[1]);
    			set_style(div2, "height", (/*height*/ ctx[2] || 400) + "px");
    			add_location(div2, file$5, 36, 0, 1160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "mouseenter", /*mouseenter_handler*/ ctx[14], false, false, false),
    					listen_dev(div2, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeIndex, slides*/ 24) {
    				each_value_1 = /*slides*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*height*/ 4) {
    				set_style(div0, "top", (/*height*/ ctx[2] || 400) - 50 + "px");
    			}

    			if (dirty & /*slides, siteurl, activeIndex*/ 25) {
    				each_value = /*slides*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*dir*/ 2 && div2_class_value !== (div2_class_value = "slider " + /*dir*/ ctx[1])) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty & /*dir*/ 2) {
    				attr_dev(div2, "dir", /*dir*/ ctx[1]);
    			}

    			if (dirty & /*height*/ 4) {
    				set_style(div2, "height", (/*height*/ ctx[2] || 400) + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-slider', slots, []);
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { siteurl = '' } = $$props;
    	let { filter = 'ID gt 0' } = $$props;
    	let { limit = 1000000 } = $$props;
    	let { dir = 'ltr' } = $$props;
    	let { height = 400 } = $$props;
    	let { interval = 5000 } = $$props;
    	let { orderField = 'ID' } = $$props;
    	let { orderDirection = 'desc' } = $$props;
    	let fields = 'Title,Subtitle,FileRef,Url';
    	let slides = [];
    	let activeIndex = 0;
    	let mouseIsIn = false;
    	let count;

    	onMount(async () => {
    		var slidesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options);
    		$$invalidate(3, slides = (await slidesRes.json()).d.results);

    		window.setInterval(
    			() => {
    				if (!mouseIsIn) {
    					$$invalidate(4, activeIndex = activeIndex + 1 >= slides.length ? 0 : activeIndex + 1);
    				}
    			},
    			interval
    		);
    	});

    	const writable_props = [
    		'weburl',
    		'list',
    		'siteurl',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'interval',
    		'orderField',
    		'orderDirection'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<sp-slider> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => {
    		$$invalidate(4, activeIndex = index);
    	};

    	const mouseenter_handler = () => {
    		$$invalidate(5, mouseIsIn = true);
    	};

    	const mouseleave_handler = () => {
    		$$invalidate(5, mouseIsIn = false);
    	};

    	$$self.$$set = $$props => {
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(8, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(9, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('interval' in $$props) $$invalidate(10, interval = $$props.interval);
    		if ('orderField' in $$props) $$invalidate(11, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(12, orderDirection = $$props.orderDirection);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		weburl,
    		list,
    		siteurl,
    		filter,
    		limit,
    		dir,
    		height,
    		interval,
    		orderField,
    		orderDirection,
    		fields,
    		slides,
    		activeIndex,
    		mouseIsIn,
    		count
    	});

    	$$self.$inject_state = $$props => {
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(8, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(9, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('interval' in $$props) $$invalidate(10, interval = $$props.interval);
    		if ('orderField' in $$props) $$invalidate(11, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(12, orderDirection = $$props.orderDirection);
    		if ('fields' in $$props) fields = $$props.fields;
    		if ('slides' in $$props) $$invalidate(3, slides = $$props.slides);
    		if ('activeIndex' in $$props) $$invalidate(4, activeIndex = $$props.activeIndex);
    		if ('mouseIsIn' in $$props) $$invalidate(5, mouseIsIn = $$props.mouseIsIn);
    		if ('count' in $$props) count = $$props.count;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*limit*/ 512) {
    			{
    				count = limit <= 0 || limit > 8 ? 4 : limit;

    				if (limit <= 0 || limit > 8) {
    					console.log('sp-slider: limit should between 0 and 8');
    				}
    			}
    		}
    	};

    	return [
    		siteurl,
    		dir,
    		height,
    		slides,
    		activeIndex,
    		mouseIsIn,
    		weburl,
    		list,
    		filter,
    		limit,
    		interval,
    		orderField,
    		orderDirection,
    		click_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Slider extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.slider{position:relative;margin-bottom:14px;overflow:hidden;border-radius:10px;box-shadow:1px 3px 8px -4px #000}.slider:hover{box-shadow:0px 2px 5px -3px #000}.slider:active{box-shadow:0px 1px 3px -1px #000}.slide{position:absolute;display:block;width:100%;height:100%;background-position-x:center;background-position-y:center;background-size:cover;transition:opacity 0.2s}.content{background:rgb(0,0,0);background:linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.4962359943977591) 56%)}.rtl .content{background:rgb(0,0,0);background:linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.4962359943977591) 56%)}.content{position:absolute;bottom:0;min-width:50%;max-width:80%;height:100%;color:#fff;box-sizing:border-box;padding:50px 5% 0}.dots{position:absolute;z-index:2;width:100%;text-align:center}.dot{margin:0 5px;display:inline-block;height:30px;border-radius:15px;background:#fff;box-shadow:0px 2px 5px -3px #000;cursor:pointer;transition:width 0.2s}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				weburl: 6,
    				list: 7,
    				siteurl: 0,
    				filter: 8,
    				limit: 9,
    				dir: 1,
    				height: 2,
    				interval: 10,
    				orderField: 11,
    				orderDirection: 12
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*weburl*/ ctx[6] === undefined && !('weburl' in props)) {
    			console_1.warn("<sp-slider> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[7] === undefined && !('list' in props)) {
    			console_1.warn("<sp-slider> was created without expected prop 'list'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"weburl",
    			"list",
    			"siteurl",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"interval",
    			"orderField",
    			"orderDirection"
    		];
    	}

    	get weburl() {
    		return this.$$.ctx[6];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[7];
    	}

    	set list(list) {
    		this.$$set({ list });
    		flush();
    	}

    	get siteurl() {
    		return this.$$.ctx[0];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get filter() {
    		return this.$$.ctx[8];
    	}

    	set filter(filter) {
    		this.$$set({ filter });
    		flush();
    	}

    	get limit() {
    		return this.$$.ctx[9];
    	}

    	set limit(limit) {
    		this.$$set({ limit });
    		flush();
    	}

    	get dir() {
    		return this.$$.ctx[1];
    	}

    	set dir(dir) {
    		this.$$set({ dir });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[2];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get interval() {
    		return this.$$.ctx[10];
    	}

    	set interval(interval) {
    		this.$$set({ interval });
    		flush();
    	}

    	get orderField() {
    		return this.$$.ctx[11];
    	}

    	set orderField(orderField) {
    		this.$$set({ orderField });
    		flush();
    	}

    	get orderDirection() {
    		return this.$$.ctx[12];
    	}

    	set orderDirection(orderDirection) {
    		this.$$set({ orderDirection });
    		flush();
    	}
    }

    customElements.define("sp-slider", Slider);

    /* src\components\cards.svelte generated by Svelte v3.43.1 */
    const file$4 = "src\\components\\cards.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (39:8) {#if page.imageUrl}
    function create_if_block$2(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let h4;
    	let t0_value = /*page*/ ctx[21].Title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = new Date(/*page*/ ctx[21][/*datefromfield*/ ctx[3]]).toLocaleDateString() + "";
    	let t2;
    	let t3;

    	let t4_value = (/*datetofield*/ ctx[4]
    	? ` - ${new Date(/*page*/ ctx[21][/*datefromfield*/ ctx[3]]).toLocaleDateString()}`
    	: '') + "";

    	let t4;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			add_location(h4, file$4, 42, 20, 1865);
    			add_location(p, file$4, 43, 20, 1908);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$4, 41, 16, 1822);
    			attr_dev(a, "class", "card");
    			attr_dev(a, "href", a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[21].FileRef}`);
    			set_style(a, "height", /*height*/ ctx[2] + "px");
    			set_style(a, "background-image", "url('" + /*page*/ ctx[21].imageUrl + "')");
    			add_location(a, file$4, 40, 12, 1681);
    			attr_dev(div1, "class", "card-column");
    			set_style(div1, "width", 100 / /*layout*/ ctx[7] + "%");
    			add_location(div1, file$4, 39, 8, 1610);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pages*/ 64 && t0_value !== (t0_value = /*page*/ ctx[21].Title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pages, datefromfield*/ 72 && t2_value !== (t2_value = new Date(/*page*/ ctx[21][/*datefromfield*/ ctx[3]]).toLocaleDateString() + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*datetofield, pages, datefromfield*/ 88 && t4_value !== (t4_value = (/*datetofield*/ ctx[4]
    			? ` - ${new Date(/*page*/ ctx[21][/*datefromfield*/ ctx[3]]).toLocaleDateString()}`
    			: '') + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*siteurl, pages*/ 65 && a_href_value !== (a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[21].FileRef}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*height*/ 4) {
    				set_style(a, "height", /*height*/ ctx[2] + "px");
    			}

    			if (dirty & /*pages*/ 64) {
    				set_style(a, "background-image", "url('" + /*page*/ ctx[21].imageUrl + "')");
    			}

    			if (dirty & /*layout*/ 128) {
    				set_style(div1, "width", 100 / /*layout*/ ctx[7] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(39:8) {#if page.imageUrl}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#each pages as page}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*page*/ ctx[21].imageUrl && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*page*/ ctx[21].imageUrl) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(38:4) {#each pages as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let div1_class_value;
    	let div1_resize_listener;
    	let each_value = /*pages*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div0 = element("div");
    			this.c = noop;
    			set_style(div0, "clear", "both");
    			add_location(div0, file$4, 49, 4, 2139);
    			attr_dev(div1, "class", div1_class_value = "cards " + /*dir*/ ctx[1]);
    			attr_dev(div1, "dir", /*dir*/ ctx[1]);
    			add_render_callback(() => /*div1_elementresize_handler*/ ctx[18].call(div1));
    			add_location(div1, file$4, 36, 0, 1476);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div1_resize_listener = add_resize_listener(div1, /*div1_elementresize_handler*/ ctx[18].bind(div1));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*layout, siteurl, pages, height, datetofield, Date, datefromfield*/ 221) {
    				each_value = /*pages*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*dir*/ 2 && div1_class_value !== (div1_class_value = "cards " + /*dir*/ ctx[1])) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*dir*/ 2) {
    				attr_dev(div1, "dir", /*dir*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			div1_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let layout;
    	let allFields;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-cards', slots, []);
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { siteurl = '' } = $$props;
    	let { filter = 'ID ne 0' } = $$props;
    	let { limit = 4 } = $$props;
    	let { dir = 'ltr' } = $$props;
    	let { height = 400 } = $$props;
    	let { smallwidth = 576 } = $$props;
    	let { mediumwidth = 768 } = $$props;
    	let { orderField = 'ID' } = $$props;
    	let { orderDirection = 'desc' } = $$props;
    	let { imagefield = 'PublishingRollupImage' } = $$props;
    	let { datefromfield = 'ArticleStartDate' } = $$props;
    	let { datetofield = '' } = $$props;
    	let fullWidth = 1;
    	let count;
    	let fields = ['Title', 'FileRef', 'FieldValuesAsHtml'];
    	let pages = [];

    	onMount(async () => {
    		var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${allFields.join(',')}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options);
    		$$invalidate(6, pages = (await pagesRes.json()).d.results);

    		for (var i = 0; i < pages.length; i++) {
    			var imgRes = await fetch(`${pages[i].FieldValuesAsHtml.__deferred.uri}`, options);
    			var fieldValues = (await imgRes.json()).d;
    			$$invalidate(6, pages[i].imageUrl = options.extractImageUrl(siteurl, fieldValues[imagefield]), pages);
    		}
    	});

    	const writable_props = [
    		'weburl',
    		'list',
    		'siteurl',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'smallwidth',
    		'mediumwidth',
    		'orderField',
    		'orderDirection',
    		'imagefield',
    		'datefromfield',
    		'datetofield'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<sp-cards> was created with unknown prop '${key}'`);
    	});

    	function div1_elementresize_handler() {
    		fullWidth = this.clientWidth;
    		$$invalidate(5, fullWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('weburl' in $$props) $$invalidate(8, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(9, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(10, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(11, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(12, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(13, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(14, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(15, orderDirection = $$props.orderDirection);
    		if ('imagefield' in $$props) $$invalidate(16, imagefield = $$props.imagefield);
    		if ('datefromfield' in $$props) $$invalidate(3, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(4, datetofield = $$props.datetofield);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		weburl,
    		list,
    		siteurl,
    		filter,
    		limit,
    		dir,
    		height,
    		smallwidth,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		imagefield,
    		datefromfield,
    		datetofield,
    		fullWidth,
    		count,
    		fields,
    		pages,
    		allFields,
    		layout
    	});

    	$$self.$inject_state = $$props => {
    		if ('weburl' in $$props) $$invalidate(8, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(9, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(10, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(11, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(12, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(13, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(14, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(15, orderDirection = $$props.orderDirection);
    		if ('imagefield' in $$props) $$invalidate(16, imagefield = $$props.imagefield);
    		if ('datefromfield' in $$props) $$invalidate(3, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(4, datetofield = $$props.datetofield);
    		if ('fullWidth' in $$props) $$invalidate(5, fullWidth = $$props.fullWidth);
    		if ('count' in $$props) $$invalidate(17, count = $$props.count);
    		if ('fields' in $$props) $$invalidate(20, fields = $$props.fields);
    		if ('pages' in $$props) $$invalidate(6, pages = $$props.pages);
    		if ('allFields' in $$props) allFields = $$props.allFields;
    		if ('layout' in $$props) $$invalidate(7, layout = $$props.layout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*limit*/ 2048) {
    			$$invalidate(17, count = limit || 4);
    		}

    		if ($$self.$$.dirty & /*fullWidth, smallwidth, mediumwidth, count*/ 143392) {
    			$$invalidate(7, layout = fullWidth <= smallwidth
    			? 1
    			: fullWidth <= mediumwidth
    				? Math.min(count, 3)
    				: Math.min(count, 6));
    		}

    		if ($$self.$$.dirty & /*datefromfield, datetofield*/ 24) {
    			allFields = fields.concat(datefromfield, datetofield).filter(f => {
    				return f;
    			});
    		}
    	};

    	return [
    		siteurl,
    		dir,
    		height,
    		datefromfield,
    		datetofield,
    		fullWidth,
    		pages,
    		layout,
    		weburl,
    		list,
    		filter,
    		limit,
    		smallwidth,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		imagefield,
    		count,
    		div1_elementresize_handler
    	];
    }

    class Cards extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.cards{margin:0 -7px 0 -7px}.card-column{float:left;padding:0 7px 0 7px;box-sizing:border-box}.rtl .card-column{float:right}.card{position:relative;border-radius:10px;box-shadow:1px 3px 8px -4px #000;overflow:hidden;display:block;margin-bottom:14px;transition:box-shadow 0.05s;background-position-x:center;background-repeat:no-repeat;width:100%}.card:hover{box-shadow:0px 2px 5px -3px #000}.card:active{box-shadow:0px 1px 3px -1px #000}.content{position:absolute;padding:10px;bottom:0;background:#fff;width:100%;box-sizing:border-box}.content *{color:#333}h4{margin:0}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				weburl: 8,
    				list: 9,
    				siteurl: 0,
    				filter: 10,
    				limit: 11,
    				dir: 1,
    				height: 2,
    				smallwidth: 12,
    				mediumwidth: 13,
    				orderField: 14,
    				orderDirection: 15,
    				imagefield: 16,
    				datefromfield: 3,
    				datetofield: 4
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*weburl*/ ctx[8] === undefined && !('weburl' in props)) {
    			console.warn("<sp-cards> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[9] === undefined && !('list' in props)) {
    			console.warn("<sp-cards> was created without expected prop 'list'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"weburl",
    			"list",
    			"siteurl",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"smallwidth",
    			"mediumwidth",
    			"orderField",
    			"orderDirection",
    			"imagefield",
    			"datefromfield",
    			"datetofield"
    		];
    	}

    	get weburl() {
    		return this.$$.ctx[8];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[9];
    	}

    	set list(list) {
    		this.$$set({ list });
    		flush();
    	}

    	get siteurl() {
    		return this.$$.ctx[0];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get filter() {
    		return this.$$.ctx[10];
    	}

    	set filter(filter) {
    		this.$$set({ filter });
    		flush();
    	}

    	get limit() {
    		return this.$$.ctx[11];
    	}

    	set limit(limit) {
    		this.$$set({ limit });
    		flush();
    	}

    	get dir() {
    		return this.$$.ctx[1];
    	}

    	set dir(dir) {
    		this.$$set({ dir });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[2];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get smallwidth() {
    		return this.$$.ctx[12];
    	}

    	set smallwidth(smallwidth) {
    		this.$$set({ smallwidth });
    		flush();
    	}

    	get mediumwidth() {
    		return this.$$.ctx[13];
    	}

    	set mediumwidth(mediumwidth) {
    		this.$$set({ mediumwidth });
    		flush();
    	}

    	get orderField() {
    		return this.$$.ctx[14];
    	}

    	set orderField(orderField) {
    		this.$$set({ orderField });
    		flush();
    	}

    	get orderDirection() {
    		return this.$$.ctx[15];
    	}

    	set orderDirection(orderDirection) {
    		this.$$set({ orderDirection });
    		flush();
    	}

    	get imagefield() {
    		return this.$$.ctx[16];
    	}

    	set imagefield(imagefield) {
    		this.$$set({ imagefield });
    		flush();
    	}

    	get datefromfield() {
    		return this.$$.ctx[3];
    	}

    	set datefromfield(datefromfield) {
    		this.$$set({ datefromfield });
    		flush();
    	}

    	get datetofield() {
    		return this.$$.ctx[4];
    	}

    	set datetofield(datetofield) {
    		this.$$set({ datetofield });
    		flush();
    	}
    }

    customElements.define("sp-cards", Cards);

    /* src\components\advancedCards.svelte generated by Svelte v3.43.1 */
    const file$3 = "src\\components\\advancedCards.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    // (70:8) {#if datefilterenabled === 'true'}
    function create_if_block_1(ctx) {
    	let div;
    	let i_calendar;
    	let t0;
    	let input0;
    	let t1;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i_calendar = element("i-calendar");
    			t0 = space();
    			input0 = element("input");
    			t1 = space();
    			input1 = element("input");
    			set_custom_element_data(i_calendar, "color", "#333");
    			add_location(i_calendar, file$3, 71, 12, 2641);
    			attr_dev(input0, "type", "date");
    			add_location(input0, file$3, 72, 12, 2693);
    			attr_dev(input1, "type", "date");
    			add_location(input1, file$3, 73, 12, 2751);
    			attr_dev(div, "class", "filters");
    			add_location(div, file$3, 70, 8, 2606);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i_calendar);
    			append_dev(div, t0);
    			append_dev(div, input0);
    			set_input_value(input0, /*fromStr*/ ctx[7]);
    			append_dev(div, t1);
    			append_dev(div, input1);
    			set_input_value(input1, /*toStr*/ ctx[8]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[25]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[26])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fromStr*/ 128) {
    				set_input_value(input0, /*fromStr*/ ctx[7]);
    			}

    			if (dirty[0] & /*toStr*/ 256) {
    				set_input_value(input1, /*toStr*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(70:8) {#if datefilterenabled === 'true'}",
    		ctx
    	});

    	return block;
    }

    // (78:12) {#if page.imageUrl}
    function create_if_block$1(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let h4;
    	let t0_value = /*page*/ ctx[32].Title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = new Date(/*page*/ ctx[32][/*datefromfield*/ ctx[4]]).toLocaleDateString() + "";
    	let t2;
    	let t3;

    	let t4_value = (/*datetofield*/ ctx[5]
    	? ` - ${new Date(/*page*/ ctx[32][/*datefromfield*/ ctx[4]]).toLocaleDateString()}`
    	: '') + "";

    	let t4;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			add_location(h4, file$3, 81, 24, 3169);
    			add_location(p, file$3, 82, 24, 3216);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$3, 80, 20, 3122);
    			attr_dev(a, "class", "card");
    			attr_dev(a, "href", a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[32].FileRef}`);
    			set_style(a, "height", /*height*/ ctx[2] + "px");
    			set_style(a, "background-image", "url('" + /*page*/ ctx[32].imageUrl + "')");
    			add_location(a, file$3, 79, 16, 2977);
    			attr_dev(div1, "class", "card-column");
    			set_style(div1, "width", 100 / /*layout*/ ctx[10] + "%");
    			add_location(div1, file$3, 78, 12, 2902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*pages*/ 512 && t0_value !== (t0_value = /*page*/ ctx[32].Title + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*pages, datefromfield*/ 528 && t2_value !== (t2_value = new Date(/*page*/ ctx[32][/*datefromfield*/ ctx[4]]).toLocaleDateString() + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*datetofield, pages, datefromfield*/ 560 && t4_value !== (t4_value = (/*datetofield*/ ctx[5]
    			? ` - ${new Date(/*page*/ ctx[32][/*datefromfield*/ ctx[4]]).toLocaleDateString()}`
    			: '') + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*siteurl, pages*/ 513 && a_href_value !== (a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[32].FileRef}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty[0] & /*height*/ 4) {
    				set_style(a, "height", /*height*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pages*/ 512) {
    				set_style(a, "background-image", "url('" + /*page*/ ctx[32].imageUrl + "')");
    			}

    			if (dirty[0] & /*layout*/ 1024) {
    				set_style(div1, "width", 100 / /*layout*/ ctx[10] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(78:12) {#if page.imageUrl}",
    		ctx
    	});

    	return block;
    }

    // (77:8) {#each pages as page}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*page*/ ctx[32].imageUrl && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*page*/ ctx[32].imageUrl) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(77:8) {#each pages as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let slot;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let div2_class_value;
    	let div2_resize_listener;
    	let if_block = /*datefilterenabled*/ ctx[3] === 'true' && create_if_block_1(ctx);
    	let each_value = /*pages*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			slot = element("slot");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			this.c = noop;
    			add_location(slot, file$3, 68, 27, 2533);
    			attr_dev(div0, "class", "title");
    			add_location(div0, file$3, 68, 8, 2514);
    			set_style(div1, "clear", "both");
    			add_location(div1, file$3, 88, 8, 3471);
    			attr_dev(div2, "class", div2_class_value = "cards " + /*dir*/ ctx[1]);
    			attr_dev(div2, "dir", /*dir*/ ctx[1]);
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[27].call(div2));
    			add_location(div2, file$3, 67, 4, 2436);
    			add_location(div3, file$3, 66, 0, 2425);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, slot);
    			append_dev(div2, t0);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[27].bind(div2));
    		},
    		p: function update(ctx, dirty) {
    			if (/*datefilterenabled*/ ctx[3] === 'true') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div2, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*layout, siteurl, pages, height, datetofield, datefromfield*/ 1589) {
    				each_value = /*pages*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*dir*/ 2 && div2_class_value !== (div2_class_value = "cards " + /*dir*/ ctx[1])) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty[0] & /*dir*/ 2) {
    				attr_dev(div2, "dir", /*dir*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			div2_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let from;
    	let to;
    	let filters;
    	let layout;
    	let allFields;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-advanced-cards', slots, []);
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { siteurl = '' } = $$props;
    	let { filter = 'ID ne 0' } = $$props;
    	let { limit = 4 } = $$props;
    	let { dir = 'ltr' } = $$props;
    	let { height = 400 } = $$props;
    	let { smallwidth = 576 } = $$props;
    	let { mediumwidth = 768 } = $$props;
    	let { orderField = 'ID' } = $$props;
    	let { orderDirection = 'desc' } = $$props;
    	let { imagefield = 'PublishingRollupImage' } = $$props;
    	let { datefilterenabled = 'true' } = $$props;
    	let { datefromfield = 'ArticleStartDate' } = $$props;
    	let { datetofield = '' } = $$props;
    	let fullWidth = 1;
    	let count;
    	let fields = ['Title', 'FileRef', 'FieldValuesAsHtml'];
    	let pages = [];
    	let filtersList = [];
    	let fromStr;
    	let toStr;

    	const getDateForFilter = date => {
    		return `${date.toISOString().substring(0, date.toISOString().indexOf('T'))}`;
    	};

    	const fetchCards = async spFilters => {
    		if (filtersList && filtersList.length > 0 && allFields && allFields.length > 0) {
    			var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${allFields.join(',')}&$top=${count}&$filter=${spFilters}&$orderby=${orderField} ${orderDirection}`, options);
    			$$invalidate(9, pages = (await pagesRes.json()).d.results);

    			for (var i = 0; i < pages.length; i++) {
    				var imgRes = await fetch(`${pages[i].FieldValuesAsHtml.__deferred.uri}`, options);
    				var fieldValues = (await imgRes.json()).d;
    				$$invalidate(9, pages[i].imageUrl = options.extractImageUrl(siteurl, fieldValues[imagefield]), pages);
    			}
    		}
    	};

    	onMount(() => {
    		fetchCards(filters);
    	});

    	const writable_props = [
    		'weburl',
    		'list',
    		'siteurl',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'smallwidth',
    		'mediumwidth',
    		'orderField',
    		'orderDirection',
    		'imagefield',
    		'datefilterenabled',
    		'datefromfield',
    		'datetofield'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<sp-advanced-cards> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		fromStr = this.value;
    		$$invalidate(7, fromStr);
    	}

    	function input1_input_handler() {
    		toStr = this.value;
    		$$invalidate(8, toStr);
    	}

    	function div2_elementresize_handler() {
    		fullWidth = this.clientWidth;
    		$$invalidate(6, fullWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('weburl' in $$props) $$invalidate(11, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(12, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(13, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(14, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(15, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(16, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(17, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(18, orderDirection = $$props.orderDirection);
    		if ('imagefield' in $$props) $$invalidate(19, imagefield = $$props.imagefield);
    		if ('datefilterenabled' in $$props) $$invalidate(3, datefilterenabled = $$props.datefilterenabled);
    		if ('datefromfield' in $$props) $$invalidate(4, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(5, datetofield = $$props.datetofield);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		weburl,
    		list,
    		siteurl,
    		filter,
    		limit,
    		dir,
    		height,
    		smallwidth,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		imagefield,
    		datefilterenabled,
    		datefromfield,
    		datetofield,
    		fullWidth,
    		count,
    		fields,
    		pages,
    		filtersList,
    		fromStr,
    		toStr,
    		getDateForFilter,
    		fetchCards,
    		filters,
    		allFields,
    		layout,
    		to,
    		from
    	});

    	$$self.$inject_state = $$props => {
    		if ('weburl' in $$props) $$invalidate(11, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(12, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(13, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(14, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(15, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(16, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(17, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(18, orderDirection = $$props.orderDirection);
    		if ('imagefield' in $$props) $$invalidate(19, imagefield = $$props.imagefield);
    		if ('datefilterenabled' in $$props) $$invalidate(3, datefilterenabled = $$props.datefilterenabled);
    		if ('datefromfield' in $$props) $$invalidate(4, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(5, datetofield = $$props.datetofield);
    		if ('fullWidth' in $$props) $$invalidate(6, fullWidth = $$props.fullWidth);
    		if ('count' in $$props) $$invalidate(20, count = $$props.count);
    		if ('fields' in $$props) $$invalidate(29, fields = $$props.fields);
    		if ('pages' in $$props) $$invalidate(9, pages = $$props.pages);
    		if ('filtersList' in $$props) $$invalidate(21, filtersList = $$props.filtersList);
    		if ('fromStr' in $$props) $$invalidate(7, fromStr = $$props.fromStr);
    		if ('toStr' in $$props) $$invalidate(8, toStr = $$props.toStr);
    		if ('filters' in $$props) $$invalidate(22, filters = $$props.filters);
    		if ('allFields' in $$props) allFields = $$props.allFields;
    		if ('layout' in $$props) $$invalidate(10, layout = $$props.layout);
    		if ('to' in $$props) $$invalidate(23, to = $$props.to);
    		if ('from' in $$props) $$invalidate(24, from = $$props.from);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*fromStr*/ 128) {
    			$$invalidate(24, from = new Date(fromStr || null));
    		}

    		if ($$self.$$.dirty[0] & /*toStr*/ 256) {
    			$$invalidate(23, to = new Date(toStr || null));
    		}

    		if ($$self.$$.dirty[0] & /*fromStr, filtersList, datefromfield, from, toStr, to, filter*/ 27271568) {
    			{
    				$$invalidate(21, filtersList = []);

    				if (fromStr) {
    					$$invalidate(21, filtersList = [
    						...filtersList,
    						`${datefromfield} ge datetime'${getDateForFilter(from)}T00:00:00Z'`
    					]);
    				}

    				if (toStr) {
    					$$invalidate(21, filtersList = [
    						...filtersList,
    						`${datefromfield} le datetime'${getDateForFilter(to)}T23:00:00Z'`
    					]);
    				}

    				if (filter) {
    					$$invalidate(21, filtersList = [...filtersList, filter]);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*filtersList*/ 2097152) {
    			$$invalidate(22, filters = `(${filtersList.join(') and (')})`);
    		}

    		if ($$self.$$.dirty[0] & /*filters*/ 4194304) {
    			{
    				fetchCards(filters);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*limit*/ 16384) {
    			$$invalidate(20, count = limit || 4);
    		}

    		if ($$self.$$.dirty[0] & /*fullWidth, smallwidth, mediumwidth, count*/ 1146944) {
    			$$invalidate(10, layout = fullWidth <= smallwidth
    			? 1
    			: fullWidth <= mediumwidth
    				? Math.min(count, 3)
    				: Math.min(count, 6));
    		}

    		if ($$self.$$.dirty[0] & /*datefromfield, datetofield*/ 48) {
    			allFields = fields.concat(datefromfield, datetofield).filter(f => {
    				return f;
    			});
    		}
    	};

    	return [
    		siteurl,
    		dir,
    		height,
    		datefilterenabled,
    		datefromfield,
    		datetofield,
    		fullWidth,
    		fromStr,
    		toStr,
    		pages,
    		layout,
    		weburl,
    		list,
    		filter,
    		limit,
    		smallwidth,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		imagefield,
    		count,
    		filtersList,
    		filters,
    		to,
    		from,
    		input0_input_handler,
    		input1_input_handler,
    		div2_elementresize_handler
    	];
    }

    class AdvancedCards extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.cards{margin:0 -7px 0 -7px}.card-column{float:left;padding:0 7px 0 7px;box-sizing:border-box}.rtl .card-column{float:right}.card{position:relative;border-radius:10px;box-shadow:1px 3px 8px -4px #000;overflow:hidden;display:block;margin-bottom:14px;transition:box-shadow 0.05s;background-position-x:center;background-repeat:no-repeat;width:100%}.card:hover{box-shadow:0px 2px 5px -3px #000}.card:active{box-shadow:0px 1px 3px -1px #000}.content{position:absolute;padding:10px;bottom:0;background:#fff;width:100%;box-sizing:border-box}.content *{color:#333}h4{margin:0}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				weburl: 11,
    				list: 12,
    				siteurl: 0,
    				filter: 13,
    				limit: 14,
    				dir: 1,
    				height: 2,
    				smallwidth: 15,
    				mediumwidth: 16,
    				orderField: 17,
    				orderDirection: 18,
    				imagefield: 19,
    				datefilterenabled: 3,
    				datefromfield: 4,
    				datetofield: 5
    			},
    			null,
    			[-1, -1]
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*weburl*/ ctx[11] === undefined && !('weburl' in props)) {
    			console.warn("<sp-advanced-cards> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[12] === undefined && !('list' in props)) {
    			console.warn("<sp-advanced-cards> was created without expected prop 'list'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"weburl",
    			"list",
    			"siteurl",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"smallwidth",
    			"mediumwidth",
    			"orderField",
    			"orderDirection",
    			"imagefield",
    			"datefilterenabled",
    			"datefromfield",
    			"datetofield"
    		];
    	}

    	get weburl() {
    		return this.$$.ctx[11];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[12];
    	}

    	set list(list) {
    		this.$$set({ list });
    		flush();
    	}

    	get siteurl() {
    		return this.$$.ctx[0];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get filter() {
    		return this.$$.ctx[13];
    	}

    	set filter(filter) {
    		this.$$set({ filter });
    		flush();
    	}

    	get limit() {
    		return this.$$.ctx[14];
    	}

    	set limit(limit) {
    		this.$$set({ limit });
    		flush();
    	}

    	get dir() {
    		return this.$$.ctx[1];
    	}

    	set dir(dir) {
    		this.$$set({ dir });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[2];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get smallwidth() {
    		return this.$$.ctx[15];
    	}

    	set smallwidth(smallwidth) {
    		this.$$set({ smallwidth });
    		flush();
    	}

    	get mediumwidth() {
    		return this.$$.ctx[16];
    	}

    	set mediumwidth(mediumwidth) {
    		this.$$set({ mediumwidth });
    		flush();
    	}

    	get orderField() {
    		return this.$$.ctx[17];
    	}

    	set orderField(orderField) {
    		this.$$set({ orderField });
    		flush();
    	}

    	get orderDirection() {
    		return this.$$.ctx[18];
    	}

    	set orderDirection(orderDirection) {
    		this.$$set({ orderDirection });
    		flush();
    	}

    	get imagefield() {
    		return this.$$.ctx[19];
    	}

    	set imagefield(imagefield) {
    		this.$$set({ imagefield });
    		flush();
    	}

    	get datefilterenabled() {
    		return this.$$.ctx[3];
    	}

    	set datefilterenabled(datefilterenabled) {
    		this.$$set({ datefilterenabled });
    		flush();
    	}

    	get datefromfield() {
    		return this.$$.ctx[4];
    	}

    	set datefromfield(datefromfield) {
    		this.$$set({ datefromfield });
    		flush();
    	}

    	get datetofield() {
    		return this.$$.ctx[5];
    	}

    	set datetofield(datetofield) {
    		this.$$set({ datetofield });
    		flush();
    	}
    }

    customElements.define("sp-advanced-cards", AdvancedCards);

    /* src\components\linksGrid.svelte generated by Svelte v3.43.1 */
    const file$2 = "src\\components\\linksGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (31:4) {#each pages as page}
    function create_each_block(ctx) {
    	let div;
    	let a;
    	let t_value = /*page*/ ctx[17].Title + "";
    	let t;
    	let a_class_value;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", a_class_value = "link " + (/*page*/ ctx[17].Url ? 'clickable' : ''));
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[17].Url);
    			set_style(a, "height", /*height*/ ctx[1] + "px");
    			set_style(a, "line-height", /*height*/ ctx[1] + "px");
    			set_style(a, "font-size", /*fontsize*/ ctx[2] + "px");
    			set_style(a, "background-color", /*page*/ ctx[17].CssColor || '#fff');
    			add_location(a, file$2, 32, 12, 1142);
    			attr_dev(div, "class", "link-column");

    			set_style(div, "width", (/*layout*/ ctx[5]
    			? Math.pow(/*page*/ ctx[17].Columns || 12, /*layout*/ ctx[5]) / 12
    			: 1) * 100 + "%");

    			add_location(div, file$2, 31, 8, 1018);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pages*/ 16 && t_value !== (t_value = /*page*/ ctx[17].Title + "")) set_data_dev(t, t_value);

    			if (dirty & /*pages*/ 16 && a_class_value !== (a_class_value = "link " + (/*page*/ ctx[17].Url ? 'clickable' : ''))) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (dirty & /*pages*/ 16 && a_href_value !== (a_href_value = /*page*/ ctx[17].Url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*height*/ 2) {
    				set_style(a, "height", /*height*/ ctx[1] + "px");
    			}

    			if (dirty & /*height*/ 2) {
    				set_style(a, "line-height", /*height*/ ctx[1] + "px");
    			}

    			if (dirty & /*fontsize*/ 4) {
    				set_style(a, "font-size", /*fontsize*/ ctx[2] + "px");
    			}

    			if (dirty & /*pages*/ 16) {
    				set_style(a, "background-color", /*page*/ ctx[17].CssColor || '#fff');
    			}

    			if (dirty & /*layout, pages*/ 48) {
    				set_style(div, "width", (/*layout*/ ctx[5]
    				? Math.pow(/*page*/ ctx[17].Columns || 12, /*layout*/ ctx[5]) / 12
    				: 1) * 100 + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(31:4) {#each pages as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let div1_class_value;
    	let div1_resize_listener;
    	let each_value = /*pages*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div0 = element("div");
    			this.c = noop;
    			set_style(div0, "clear", "both");
    			add_location(div0, file$2, 37, 4, 1411);
    			attr_dev(div1, "class", div1_class_value = "links " + /*dir*/ ctx[0]);
    			attr_dev(div1, "dir", /*dir*/ ctx[0]);
    			add_render_callback(() => /*div1_elementresize_handler*/ ctx[14].call(div1));
    			add_location(div1, file$2, 29, 0, 913);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div1_resize_listener = add_resize_listener(div1, /*div1_elementresize_handler*/ ctx[14].bind(div1));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*layout, Math, pages, height, fontsize*/ 54) {
    				each_value = /*pages*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*dir*/ 1 && div1_class_value !== (div1_class_value = "links " + /*dir*/ ctx[0])) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*dir*/ 1) {
    				attr_dev(div1, "dir", /*dir*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			div1_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let layout;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-links-grid', slots, []);
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { siteurl = '' } = $$props;
    	let { filter = 'ID gt 0' } = $$props;
    	let { limit = 1000000 } = $$props;
    	let { dir = 'ltr' } = $$props;
    	let { height = 35 } = $$props;
    	let { mediumwidth = 768 } = $$props;
    	let { orderField = 'ID' } = $$props;
    	let { orderDirection = 'desc' } = $$props;
    	let { fontsize = 16 } = $$props;
    	let fullWidth = 1;
    	let count;
    	let fields = 'Title,Url,CssColor,Columns';
    	let pages = [];

    	onMount(async () => {
    		var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items?$select=${fields}&$top=${count}&$filter=${filter}&$orderby=${orderField} ${orderDirection}`, options);
    		$$invalidate(4, pages = (await pagesRes.json()).d.results);
    	});

    	const writable_props = [
    		'weburl',
    		'list',
    		'siteurl',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'mediumwidth',
    		'orderField',
    		'orderDirection',
    		'fontsize'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<sp-links-grid> was created with unknown prop '${key}'`);
    	});

    	function div1_elementresize_handler() {
    		fullWidth = this.clientWidth;
    		$$invalidate(3, fullWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(8, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(9, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(10, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('mediumwidth' in $$props) $$invalidate(11, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(12, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(13, orderDirection = $$props.orderDirection);
    		if ('fontsize' in $$props) $$invalidate(2, fontsize = $$props.fontsize);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		weburl,
    		list,
    		siteurl,
    		filter,
    		limit,
    		dir,
    		height,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		fontsize,
    		fullWidth,
    		count,
    		fields,
    		pages,
    		layout
    	});

    	$$self.$inject_state = $$props => {
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(8, siteurl = $$props.siteurl);
    		if ('filter' in $$props) $$invalidate(9, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(10, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('mediumwidth' in $$props) $$invalidate(11, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(12, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(13, orderDirection = $$props.orderDirection);
    		if ('fontsize' in $$props) $$invalidate(2, fontsize = $$props.fontsize);
    		if ('fullWidth' in $$props) $$invalidate(3, fullWidth = $$props.fullWidth);
    		if ('count' in $$props) count = $$props.count;
    		if ('fields' in $$props) fields = $$props.fields;
    		if ('pages' in $$props) $$invalidate(4, pages = $$props.pages);
    		if ('layout' in $$props) $$invalidate(5, layout = $$props.layout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*limit*/ 1024) {
    			{
    				count = limit <= 0 ? 4 : limit;
    			}
    		}

    		if ($$self.$$.dirty & /*fullWidth, mediumwidth*/ 2056) {
    			$$invalidate(5, layout = fullWidth > mediumwidth ? 1 : 0);
    		}
    	};

    	return [
    		dir,
    		height,
    		fontsize,
    		fullWidth,
    		pages,
    		layout,
    		weburl,
    		list,
    		siteurl,
    		filter,
    		limit,
    		mediumwidth,
    		orderField,
    		orderDirection,
    		div1_elementresize_handler
    	];
    }

    class LinksGrid extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.links{margin:0 -7px 0 -7px}.link-column{float:left;padding:0 7px 0 7px;box-sizing:border-box;margin-bottom:14px}.rtl .link-column{float:right}.link{border-radius:10px;display:block;width:100%;text-align:center;text-decoration:none;color:#fff}.clickable{background:linear-gradient(163deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%);box-shadow:1px 3px 8px -4px #000;transition:all 0.05s}.clickable:hover{background:linear-gradient(350deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%);box-shadow:0px 2px 5px -3px #000}.clickable:active{background:linear-gradient(163deg, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.0) 100%);box-shadow:0px 1px 3px -1px #000}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				weburl: 6,
    				list: 7,
    				siteurl: 8,
    				filter: 9,
    				limit: 10,
    				dir: 0,
    				height: 1,
    				mediumwidth: 11,
    				orderField: 12,
    				orderDirection: 13,
    				fontsize: 2
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*weburl*/ ctx[6] === undefined && !('weburl' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[7] === undefined && !('list' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'list'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"weburl",
    			"list",
    			"siteurl",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"mediumwidth",
    			"orderField",
    			"orderDirection",
    			"fontsize"
    		];
    	}

    	get weburl() {
    		return this.$$.ctx[6];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[7];
    	}

    	set list(list) {
    		this.$$set({ list });
    		flush();
    	}

    	get siteurl() {
    		return this.$$.ctx[8];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get filter() {
    		return this.$$.ctx[9];
    	}

    	set filter(filter) {
    		this.$$set({ filter });
    		flush();
    	}

    	get limit() {
    		return this.$$.ctx[10];
    	}

    	set limit(limit) {
    		this.$$set({ limit });
    		flush();
    	}

    	get dir() {
    		return this.$$.ctx[0];
    	}

    	set dir(dir) {
    		this.$$set({ dir });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[1];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get mediumwidth() {
    		return this.$$.ctx[11];
    	}

    	set mediumwidth(mediumwidth) {
    		this.$$set({ mediumwidth });
    		flush();
    	}

    	get orderField() {
    		return this.$$.ctx[12];
    	}

    	set orderField(orderField) {
    		this.$$set({ orderField });
    		flush();
    	}

    	get orderDirection() {
    		return this.$$.ctx[13];
    	}

    	set orderDirection(orderDirection) {
    		this.$$set({ orderDirection });
    		flush();
    	}

    	get fontsize() {
    		return this.$$.ctx[2];
    	}

    	set fontsize(fontsize) {
    		this.$$set({ fontsize });
    		flush();
    	}
    }

    customElements.define("sp-links-grid", LinksGrid);

    /* src\components\pageBrief.svelte generated by Svelte v3.43.1 */
    const file$1 = "src\\components\\pageBrief.svelte";

    // (28:0) {#if page && page.imageUrl}
    function create_if_block(ctx) {
    	let div4;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div2;
    	let div1;
    	let h3;
    	let t1_value = /*page*/ ctx[6].Title + "";
    	let t1;
    	let t2;
    	let p;
    	let raw_value = /*page*/ ctx[6].PublishingPageContent + "";
    	let t3;
    	let div3;
    	let div4_class_value;
    	let div4_resize_listener;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = space();
    			div3 = element("div");
    			if (!src_url_equal(img.src, img_src_value = /*page*/ ctx[6].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*page*/ ctx[6].Title);
    			attr_dev(img, "style", "");
    			add_location(img, file$1, 30, 8, 1268);
    			attr_dev(div0, "class", "image-box");
    			set_style(div0, "float", /*float*/ ctx[7]);
    			set_style(div0, "width", /*imageWidthPercentage*/ ctx[8] + "%");
    			add_location(div0, file$1, 29, 4, 1179);
    			add_location(h3, file$1, 34, 12, 1513);
    			add_location(p, file$1, 35, 12, 1548);
    			add_location(div1, file$1, 33, 8, 1494);
    			attr_dev(div2, "class", "content-box");
    			set_style(div2, "float", /*float*/ ctx[7]);

    			set_style(div2, "width", (/*imageWidthPercentage*/ ctx[8] == 100
    			? 100
    			: 100 - /*imageWidthPercentage*/ ctx[8]) + "%");

    			set_style(div2, "color", /*textcolor*/ ctx[3]);
    			add_location(div2, file$1, 32, 4, 1342);
    			set_style(div3, "clear", "both");
    			add_location(div3, file$1, 38, 4, 1623);
    			attr_dev(div4, "class", div4_class_value = "page " + /*dir*/ ctx[0]);
    			attr_dev(div4, "dir", /*dir*/ ctx[0]);
    			set_style(div4, "height", /*isMobile*/ ctx[5] ? 'auto' : /*height*/ ctx[1] + 'px');
    			set_style(div4, "background-color", /*backgroundcolor*/ ctx[2]);
    			add_render_callback(() => /*div4_elementresize_handler*/ ctx[16].call(div4));
    			add_location(div4, file$1, 28, 0, 1017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, img);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			p.innerHTML = raw_value;
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			div4_resize_listener = add_resize_listener(div4, /*div4_elementresize_handler*/ ctx[16].bind(div4));
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*page*/ 64 && !src_url_equal(img.src, img_src_value = /*page*/ ctx[6].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*page*/ 64 && img_alt_value !== (img_alt_value = /*page*/ ctx[6].Title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*float*/ 128) {
    				set_style(div0, "float", /*float*/ ctx[7]);
    			}

    			if (dirty & /*imageWidthPercentage*/ 256) {
    				set_style(div0, "width", /*imageWidthPercentage*/ ctx[8] + "%");
    			}

    			if (dirty & /*page*/ 64 && t1_value !== (t1_value = /*page*/ ctx[6].Title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*page*/ 64 && raw_value !== (raw_value = /*page*/ ctx[6].PublishingPageContent + "")) p.innerHTML = raw_value;
    			if (dirty & /*float*/ 128) {
    				set_style(div2, "float", /*float*/ ctx[7]);
    			}

    			if (dirty & /*imageWidthPercentage*/ 256) {
    				set_style(div2, "width", (/*imageWidthPercentage*/ ctx[8] == 100
    				? 100
    				: 100 - /*imageWidthPercentage*/ ctx[8]) + "%");
    			}

    			if (dirty & /*textcolor*/ 8) {
    				set_style(div2, "color", /*textcolor*/ ctx[3]);
    			}

    			if (dirty & /*dir*/ 1 && div4_class_value !== (div4_class_value = "page " + /*dir*/ ctx[0])) {
    				attr_dev(div4, "class", div4_class_value);
    			}

    			if (dirty & /*dir*/ 1) {
    				attr_dev(div4, "dir", /*dir*/ ctx[0]);
    			}

    			if (dirty & /*isMobile, height*/ 34) {
    				set_style(div4, "height", /*isMobile*/ ctx[5] ? 'auto' : /*height*/ ctx[1] + 'px');
    			}

    			if (dirty & /*backgroundcolor*/ 4) {
    				set_style(div4, "background-color", /*backgroundcolor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			div4_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:0) {#if page && page.imageUrl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*page*/ ctx[6] && /*page*/ ctx[6].imageUrl && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.c = noop;
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*page*/ ctx[6] && /*page*/ ctx[6].imageUrl) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let isMobile;
    	let imageWidthPercentage;
    	let float;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-page-brief', slots, []);
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { siteurl = '' } = $$props;
    	let { pageid } = $$props;
    	let { dir = 'ltr' } = $$props;
    	let { imageisend = 'true' } = $$props;
    	let { height = 400 } = $$props;
    	let { smallwidth = 768 } = $$props;
    	let { imagefield = 'PublishingRollupImage' } = $$props;
    	let { backgroundcolor = 'transparent' } = $$props;
    	let { textcolor = '#333' } = $$props;
    	let fullWidth = 1;
    	let page = {};

    	onMount(async () => {
    		var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items(${pageid})/FieldValuesAsHtml`, options);
    		$$invalidate(6, page = (await pagesRes.json()).d);
    		$$invalidate(6, page.imageUrl = options.extractImageUrl(siteurl, page[imagefield]), page);
    	});

    	const writable_props = [
    		'weburl',
    		'list',
    		'siteurl',
    		'pageid',
    		'dir',
    		'imageisend',
    		'height',
    		'smallwidth',
    		'imagefield',
    		'backgroundcolor',
    		'textcolor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<sp-page-brief> was created with unknown prop '${key}'`);
    	});

    	function div4_elementresize_handler() {
    		fullWidth = this.clientWidth;
    		$$invalidate(4, fullWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('weburl' in $$props) $$invalidate(9, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(10, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(11, siteurl = $$props.siteurl);
    		if ('pageid' in $$props) $$invalidate(12, pageid = $$props.pageid);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('imageisend' in $$props) $$invalidate(13, imageisend = $$props.imageisend);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(14, smallwidth = $$props.smallwidth);
    		if ('imagefield' in $$props) $$invalidate(15, imagefield = $$props.imagefield);
    		if ('backgroundcolor' in $$props) $$invalidate(2, backgroundcolor = $$props.backgroundcolor);
    		if ('textcolor' in $$props) $$invalidate(3, textcolor = $$props.textcolor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		weburl,
    		list,
    		siteurl,
    		pageid,
    		dir,
    		imageisend,
    		height,
    		smallwidth,
    		imagefield,
    		backgroundcolor,
    		textcolor,
    		fullWidth,
    		page,
    		float,
    		isMobile,
    		imageWidthPercentage
    	});

    	$$self.$inject_state = $$props => {
    		if ('weburl' in $$props) $$invalidate(9, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(10, list = $$props.list);
    		if ('siteurl' in $$props) $$invalidate(11, siteurl = $$props.siteurl);
    		if ('pageid' in $$props) $$invalidate(12, pageid = $$props.pageid);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('imageisend' in $$props) $$invalidate(13, imageisend = $$props.imageisend);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(14, smallwidth = $$props.smallwidth);
    		if ('imagefield' in $$props) $$invalidate(15, imagefield = $$props.imagefield);
    		if ('backgroundcolor' in $$props) $$invalidate(2, backgroundcolor = $$props.backgroundcolor);
    		if ('textcolor' in $$props) $$invalidate(3, textcolor = $$props.textcolor);
    		if ('fullWidth' in $$props) $$invalidate(4, fullWidth = $$props.fullWidth);
    		if ('page' in $$props) $$invalidate(6, page = $$props.page);
    		if ('float' in $$props) $$invalidate(7, float = $$props.float);
    		if ('isMobile' in $$props) $$invalidate(5, isMobile = $$props.isMobile);
    		if ('imageWidthPercentage' in $$props) $$invalidate(8, imageWidthPercentage = $$props.imageWidthPercentage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fullWidth, smallwidth*/ 16400) {
    			$$invalidate(5, isMobile = fullWidth <= smallwidth);
    		}

    		if ($$self.$$.dirty & /*isMobile*/ 32) {
    			$$invalidate(8, imageWidthPercentage = isMobile ? 100 : 40);
    		}

    		if ($$self.$$.dirty & /*imageisend, dir*/ 8193) {
    			$$invalidate(7, float = imageisend !== 'false'
    			? dir === 'rtl' ? 'left' : 'right'
    			: dir === 'ltr' ? 'left' : 'right');
    		}
    	};

    	return [
    		dir,
    		height,
    		backgroundcolor,
    		textcolor,
    		fullWidth,
    		isMobile,
    		page,
    		float,
    		imageWidthPercentage,
    		weburl,
    		list,
    		siteurl,
    		pageid,
    		imageisend,
    		smallwidth,
    		imagefield,
    		div4_elementresize_handler
    	];
    }

    class PageBrief extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>*{box-sizing:border-box}.page{padding:25px 1%;margin-bottom:14px}img{display:block;border:none;border-radius:10px;margin:0 auto;max-width:100%;max-height:100%}.image-box{padding:0 1%;height:100%}.content-box{padding:0 1%}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				weburl: 9,
    				list: 10,
    				siteurl: 11,
    				pageid: 12,
    				dir: 0,
    				imageisend: 13,
    				height: 1,
    				smallwidth: 14,
    				imagefield: 15,
    				backgroundcolor: 2,
    				textcolor: 3
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*weburl*/ ctx[9] === undefined && !('weburl' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[10] === undefined && !('list' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'list'");
    		}

    		if (/*pageid*/ ctx[12] === undefined && !('pageid' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'pageid'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"weburl",
    			"list",
    			"siteurl",
    			"pageid",
    			"dir",
    			"imageisend",
    			"height",
    			"smallwidth",
    			"imagefield",
    			"backgroundcolor",
    			"textcolor"
    		];
    	}

    	get weburl() {
    		return this.$$.ctx[9];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[10];
    	}

    	set list(list) {
    		this.$$set({ list });
    		flush();
    	}

    	get siteurl() {
    		return this.$$.ctx[11];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get pageid() {
    		return this.$$.ctx[12];
    	}

    	set pageid(pageid) {
    		this.$$set({ pageid });
    		flush();
    	}

    	get dir() {
    		return this.$$.ctx[0];
    	}

    	set dir(dir) {
    		this.$$set({ dir });
    		flush();
    	}

    	get imageisend() {
    		return this.$$.ctx[13];
    	}

    	set imageisend(imageisend) {
    		this.$$set({ imageisend });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[1];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get smallwidth() {
    		return this.$$.ctx[14];
    	}

    	set smallwidth(smallwidth) {
    		this.$$set({ smallwidth });
    		flush();
    	}

    	get imagefield() {
    		return this.$$.ctx[15];
    	}

    	set imagefield(imagefield) {
    		this.$$set({ imagefield });
    		flush();
    	}

    	get backgroundcolor() {
    		return this.$$.ctx[2];
    	}

    	set backgroundcolor(backgroundcolor) {
    		this.$$set({ backgroundcolor });
    		flush();
    	}

    	get textcolor() {
    		return this.$$.ctx[3];
    	}

    	set textcolor(textcolor) {
    		this.$$set({ textcolor });
    		flush();
    	}
    }

    customElements.define("sp-page-brief", PageBrief);

    /* src\components\icons\calendar.svelte generated by Svelte v3.43.1 */

    const file = "src\\components\\icons\\calendar.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			this.c = noop;
    			attr_dev(path0, "fill", /*color*/ ctx[2]);
    			attr_dev(path0, "d", "M18.5 2h-2.5v-0.5c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v0.5h-10v-0.5c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v0.5h-2.5c-0.827 0-1.5 0.673-1.5 1.5v14c0 0.827 0.673 1.5 1.5 1.5h17c0.827 0 1.5-0.673 1.5-1.5v-14c0-0.827-0.673-1.5-1.5-1.5zM1.5 3h2.5v1.5c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-1.5h10v1.5c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-1.5h2.5c0.276 0 0.5 0.224 0.5 0.5v2.5h-18v-2.5c0-0.276 0.224-0.5 0.5-0.5zM18.5 18h-17c-0.276 0-0.5-0.224-0.5-0.5v-10.5h18v10.5c0 0.276-0.224 0.5-0.5 0.5z");
    			add_location(path0, file, 8, 4, 319);
    			attr_dev(path1, "fill", /*color*/ ctx[2]);
    			attr_dev(path1, "d", "M7.5 10h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path1, file, 9, 4, 872);
    			attr_dev(path2, "fill", /*color*/ ctx[2]);
    			attr_dev(path2, "d", "M10.5 10h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path2, file, 10, 4, 1014);
    			attr_dev(path3, "fill", /*color*/ ctx[2]);
    			attr_dev(path3, "d", "M13.5 10h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path3, file, 11, 4, 1157);
    			attr_dev(path4, "fill", /*color*/ ctx[2]);
    			attr_dev(path4, "d", "M16.5 10h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path4, file, 12, 4, 1300);
    			attr_dev(path5, "fill", /*color*/ ctx[2]);
    			attr_dev(path5, "d", "M4.5 12h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path5, file, 13, 4, 1443);
    			attr_dev(path6, "fill", /*color*/ ctx[2]);
    			attr_dev(path6, "d", "M7.5 12h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path6, file, 14, 4, 1585);
    			attr_dev(path7, "fill", /*color*/ ctx[2]);
    			attr_dev(path7, "d", "M10.5 12h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path7, file, 15, 4, 1727);
    			attr_dev(path8, "fill", /*color*/ ctx[2]);
    			attr_dev(path8, "d", "M13.5 12h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path8, file, 16, 4, 1870);
    			attr_dev(path9, "fill", /*color*/ ctx[2]);
    			attr_dev(path9, "d", "M16.5 12h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path9, file, 17, 4, 2013);
    			attr_dev(path10, "fill", /*color*/ ctx[2]);
    			attr_dev(path10, "d", "M4.5 14h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path10, file, 18, 4, 2156);
    			attr_dev(path11, "fill", /*color*/ ctx[2]);
    			attr_dev(path11, "d", "M7.5 14h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path11, file, 19, 4, 2298);
    			attr_dev(path12, "fill", /*color*/ ctx[2]);
    			attr_dev(path12, "d", "M10.5 14h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path12, file, 20, 4, 2440);
    			attr_dev(path13, "fill", /*color*/ ctx[2]);
    			attr_dev(path13, "d", "M13.5 14h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path13, file, 21, 4, 2583);
    			attr_dev(path14, "fill", /*color*/ ctx[2]);
    			attr_dev(path14, "d", "M16.5 14h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path14, file, 22, 4, 2726);
    			attr_dev(path15, "fill", /*color*/ ctx[2]);
    			attr_dev(path15, "d", "M4.5 16h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path15, file, 23, 4, 2869);
    			attr_dev(path16, "fill", /*color*/ ctx[2]);
    			attr_dev(path16, "d", "M7.5 16h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path16, file, 24, 4, 3011);
    			attr_dev(path17, "fill", /*color*/ ctx[2]);
    			attr_dev(path17, "d", "M10.5 16h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path17, file, 25, 4, 3153);
    			attr_dev(path18, "fill", /*color*/ ctx[2]);
    			attr_dev(path18, "d", "M13.5 16h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path18, file, 26, 4, 3296);
    			attr_dev(path19, "fill", /*color*/ ctx[2]);
    			attr_dev(path19, "d", "M16.5 16h-1c-0.276 0-0.5-0.224-0.5-0.5s0.224-0.5 0.5-0.5h1c0.276 0 0.5 0.224 0.5 0.5s-0.224 0.5-0.5 0.5z");
    			add_location(path19, file, 27, 4, 3439);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			add_location(svg, file, 7, 0, 162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path0, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path1, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path2, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path3, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path4, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path5, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path6, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path7, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path8, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path9, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path10, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path11, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path12, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path13, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path14, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path15, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path16, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path17, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path18, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(path19, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('i-calendar', slots, []);
    	let { width = 40 } = $$props;
    	let { height = 40 } = $$props;
    	let { color = '#000' } = $$props;
    	const writable_props = ['width', 'height', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<i-calendar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ width, height, color });

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color];
    }

    class Calendar extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{ width: 0, height: 1, color: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["width", "height", "color"];
    	}

    	get width() {
    		return this.$$.ctx[0];
    	}

    	set width(width) {
    		this.$$set({ width });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[1];
    	}

    	set height(height) {
    		this.$$set({ height });
    		flush();
    	}

    	get color() {
    		return this.$$.ctx[2];
    	}

    	set color(color) {
    		this.$$set({ color });
    		flush();
    	}
    }

    customElements.define("i-calendar", Calendar);

    var main = [Slider, Cards, LinksGrid, AdvancedCards, PageBrief, Calendar];

    return main;

})();
//# sourceMappingURL=bundle.js.map
