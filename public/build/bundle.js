
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function children(element) {
        return Array.from(element.childNodes);
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
        headers: {
            'Accept': 'application/json;odata=verbose',
        }
    };

    /* src\components\slider.svelte generated by Svelte v3.43.1 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\components\\slider.svelte";

    function get_each_context$2(ctx, list, i) {
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
    			add_location(div, file$3, 39, 8, 1432);
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
    function create_if_block(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*slide*/ ctx[18].Title && create_if_block_2(ctx);
    	let if_block1 = /*slide*/ ctx[18].Subtitle && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file$3, 45, 12, 1880);
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
    					if_block1 = create_if_block_1(ctx);
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
    		id: create_if_block.name,
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
    			add_location(h1, file$3, 46, 33, 1936);
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
    function create_if_block_1(ctx) {
    	let h3;
    	let t_value = /*slide*/ ctx[18].Subtitle + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			add_location(h3, file$3, 47, 36, 2001);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(48:16) {#if slide.Subtitle}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each slides as slide, index}
    function create_each_block$2(ctx) {
    	let a;
    	let a_href_value;
    	let if_block = (/*slide*/ ctx[18].Title || /*slide*/ ctx[18].Subtitle) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block) if_block.c();
    			attr_dev(a, "href", a_href_value = /*slide*/ ctx[18].Url?.Url);
    			attr_dev(a, "class", "slide");
    			set_style(a, "background-image", "url('" + `${/*siteurl*/ ctx[0]}${/*slide*/ ctx[18].FileRef}` + "')");
    			set_style(a, "z-index", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			set_style(a, "opacity", /*index*/ ctx[20] == /*activeIndex*/ ctx[4] ? '1' : '0');
    			add_location(a, file$3, 43, 8, 1622);
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
    					if_block = create_if_block(ctx);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(43:4) {#each slides as slide, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			add_location(div0, file$3, 37, 4, 1329);
    			set_style(div1, "clear", "both");
    			add_location(div1, file$3, 52, 4, 2103);
    			attr_dev(div2, "class", div2_class_value = "slider " + /*dir*/ ctx[1]);
    			attr_dev(div2, "dir", /*dir*/ ctx[1]);
    			set_style(div2, "height", (/*height*/ ctx[2] || 400) + "px");
    			add_location(div2, file$3, 36, 0, 1163);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-slider', slots, []);
    	let { siteurl } = $$props;
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { filter = 'Active eq 1' } = $$props;
    	let { limit = 1000000 } = $$props;
    	let { dir } = $$props;
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
    		'siteurl',
    		'weburl',
    		'list',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'interval',
    		'orderField',
    		'orderDirection'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<sp-slider> was created with unknown prop '${key}'`);
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
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
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
    		siteurl,
    		weburl,
    		list,
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
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(6, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(7, list = $$props.list);
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

    				if (limit <= 0 || limit > 8 ? 4 : limit) {
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
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				siteurl: 0,
    				weburl: 6,
    				list: 7,
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

    		if (/*siteurl*/ ctx[0] === undefined && !('siteurl' in props)) {
    			console_1$1.warn("<sp-slider> was created without expected prop 'siteurl'");
    		}

    		if (/*weburl*/ ctx[6] === undefined && !('weburl' in props)) {
    			console_1$1.warn("<sp-slider> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[7] === undefined && !('list' in props)) {
    			console_1$1.warn("<sp-slider> was created without expected prop 'list'");
    		}

    		if (/*dir*/ ctx[1] === undefined && !('dir' in props)) {
    			console_1$1.warn("<sp-slider> was created without expected prop 'dir'");
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
    			"siteurl",
    			"weburl",
    			"list",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"interval",
    			"orderField",
    			"orderDirection"
    		];
    	}

    	get siteurl() {
    		return this.$$.ctx[0];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
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

    const { console: console_1 } = globals;
    const file$2 = "src\\components\\cards.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (44:4) {#each pages as page}
    function create_each_block$1(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let h4;
    	let t0_value = /*page*/ ctx[20].Title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = new Date(/*page*/ ctx[20][/*datefromfield*/ ctx[3]]).toLocaleDateString() + "";
    	let t2;
    	let t3;

    	let t4_value = (/*datetofield*/ ctx[4]
    	? ` - ${new Date(/*page*/ ctx[20][/*datefromfield*/ ctx[3]]).toLocaleDateString()}`
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
    			add_location(h4, file$2, 47, 20, 2028);
    			add_location(p, file$2, 48, 20, 2071);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$2, 46, 16, 1985);
    			attr_dev(a, "class", "card");
    			attr_dev(a, "href", a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[20].FileRef}`);
    			set_style(a, "height", /*height*/ ctx[2] + "px");
    			set_style(a, "background-image", "url('" + /*page*/ ctx[20].imageUrl + "')");
    			add_location(a, file$2, 45, 12, 1844);
    			attr_dev(div1, "class", "card-column");
    			set_style(div1, "width", 100 / /*layout*/ ctx[7] + "%");
    			add_location(div1, file$2, 44, 8, 1773);
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
    			if (dirty & /*pages*/ 64 && t0_value !== (t0_value = /*page*/ ctx[20].Title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pages, datefromfield*/ 72 && t2_value !== (t2_value = new Date(/*page*/ ctx[20][/*datefromfield*/ ctx[3]]).toLocaleDateString() + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*datetofield, pages, datefromfield*/ 88 && t4_value !== (t4_value = (/*datetofield*/ ctx[4]
    			? ` - ${new Date(/*page*/ ctx[20][/*datefromfield*/ ctx[3]]).toLocaleDateString()}`
    			: '') + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*siteurl, pages*/ 65 && a_href_value !== (a_href_value = `${/*siteurl*/ ctx[0]}${/*page*/ ctx[20].FileRef}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*height*/ 4) {
    				set_style(a, "height", /*height*/ ctx[2] + "px");
    			}

    			if (dirty & /*pages*/ 64) {
    				set_style(a, "background-image", "url('" + /*page*/ ctx[20].imageUrl + "')");
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(44:4) {#each pages as page}",
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
    	let each_value = /*pages*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			add_location(div0, file$2, 53, 4, 2287);
    			attr_dev(div1, "class", div1_class_value = "cards " + /*dir*/ ctx[1]);
    			attr_dev(div1, "dir", /*dir*/ ctx[1]);
    			add_render_callback(() => /*div1_elementresize_handler*/ ctx[17].call(div1));
    			add_location(div1, file$2, 42, 0, 1668);
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
    			div1_resize_listener = add_resize_listener(div1, /*div1_elementresize_handler*/ ctx[17].bind(div1));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*layout, siteurl, pages, height, datetofield, Date, datefromfield*/ 221) {
    				each_value = /*pages*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let layout;
    	let allFields;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-cards', slots, []);
    	let { siteurl } = $$props;
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { filter = 'ID ne 0' } = $$props;
    	let { limit } = $$props;
    	let { dir } = $$props;
    	let { height = 400 } = $$props;
    	let { smallwidth = 576 } = $$props;
    	let { mediumwidth = 768 } = $$props;
    	let { orderField = 'ID' } = $$props;
    	let { orderDirection = 'desc' } = $$props;
    	let { datefromfield } = $$props;
    	let { datetofield } = $$props;
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
    			var element = document.createElement('DIV');
    			element.innerHTML = fieldValues.PublishingRollupImage;
    			$$invalidate(6, pages[i].imageUrl = `${siteurl}${element.firstElementChild.attributes['src'].nodeValue}`, pages);
    		}
    	});

    	const writable_props = [
    		'siteurl',
    		'weburl',
    		'list',
    		'filter',
    		'limit',
    		'dir',
    		'height',
    		'smallwidth',
    		'mediumwidth',
    		'orderField',
    		'orderDirection',
    		'datefromfield',
    		'datetofield'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<sp-cards> was created with unknown prop '${key}'`);
    	});

    	function div1_elementresize_handler() {
    		fullWidth = this.clientWidth;
    		$$invalidate(5, fullWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(8, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(9, list = $$props.list);
    		if ('filter' in $$props) $$invalidate(10, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(11, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(12, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(13, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(14, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(15, orderDirection = $$props.orderDirection);
    		if ('datefromfield' in $$props) $$invalidate(3, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(4, datetofield = $$props.datetofield);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		siteurl,
    		weburl,
    		list,
    		filter,
    		limit,
    		dir,
    		height,
    		smallwidth,
    		mediumwidth,
    		orderField,
    		orderDirection,
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
    		if ('siteurl' in $$props) $$invalidate(0, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(8, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(9, list = $$props.list);
    		if ('filter' in $$props) $$invalidate(10, filter = $$props.filter);
    		if ('limit' in $$props) $$invalidate(11, limit = $$props.limit);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(12, smallwidth = $$props.smallwidth);
    		if ('mediumwidth' in $$props) $$invalidate(13, mediumwidth = $$props.mediumwidth);
    		if ('orderField' in $$props) $$invalidate(14, orderField = $$props.orderField);
    		if ('orderDirection' in $$props) $$invalidate(15, orderDirection = $$props.orderDirection);
    		if ('datefromfield' in $$props) $$invalidate(3, datefromfield = $$props.datefromfield);
    		if ('datetofield' in $$props) $$invalidate(4, datetofield = $$props.datetofield);
    		if ('fullWidth' in $$props) $$invalidate(5, fullWidth = $$props.fullWidth);
    		if ('count' in $$props) $$invalidate(16, count = $$props.count);
    		if ('fields' in $$props) $$invalidate(19, fields = $$props.fields);
    		if ('pages' in $$props) $$invalidate(6, pages = $$props.pages);
    		if ('allFields' in $$props) allFields = $$props.allFields;
    		if ('layout' in $$props) $$invalidate(7, layout = $$props.layout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*limit*/ 2048) {
    			{
    				$$invalidate(16, count = limit <= 0 || limit > 8 ? 4 : limit);

    				if (limit <= 0 || limit > 8 ? 4 : limit) {
    					console.log('sp-cards: limit should between 0 and 8');
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*fullWidth, smallwidth, mediumwidth, count*/ 77856) {
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
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				siteurl: 0,
    				weburl: 8,
    				list: 9,
    				filter: 10,
    				limit: 11,
    				dir: 1,
    				height: 2,
    				smallwidth: 12,
    				mediumwidth: 13,
    				orderField: 14,
    				orderDirection: 15,
    				datefromfield: 3,
    				datetofield: 4
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*siteurl*/ ctx[0] === undefined && !('siteurl' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'siteurl'");
    		}

    		if (/*weburl*/ ctx[8] === undefined && !('weburl' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[9] === undefined && !('list' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'list'");
    		}

    		if (/*limit*/ ctx[11] === undefined && !('limit' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'limit'");
    		}

    		if (/*dir*/ ctx[1] === undefined && !('dir' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'dir'");
    		}

    		if (/*datefromfield*/ ctx[3] === undefined && !('datefromfield' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'datefromfield'");
    		}

    		if (/*datetofield*/ ctx[4] === undefined && !('datetofield' in props)) {
    			console_1.warn("<sp-cards> was created without expected prop 'datetofield'");
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
    			"siteurl",
    			"weburl",
    			"list",
    			"filter",
    			"limit",
    			"dir",
    			"height",
    			"smallwidth",
    			"mediumwidth",
    			"orderField",
    			"orderDirection",
    			"datefromfield",
    			"datetofield"
    		];
    	}

    	get siteurl() {
    		return this.$$.ctx[0];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
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

    /* src\components\linksGrid.svelte generated by Svelte v3.43.1 */
    const file$1 = "src\\components\\linksGrid.svelte";

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
    			add_location(a, file$1, 32, 12, 1123);
    			attr_dev(div, "class", "link-column");

    			set_style(div, "width", (/*layout*/ ctx[5]
    			? Math.pow(/*page*/ ctx[17].Columns || 12, /*layout*/ ctx[5]) / 12
    			: 1) * 100 + "%");

    			add_location(div, file$1, 31, 8, 999);
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

    function create_fragment$1(ctx) {
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
    			add_location(div0, file$1, 37, 4, 1392);
    			attr_dev(div1, "class", div1_class_value = "links " + /*dir*/ ctx[0]);
    			attr_dev(div1, "dir", /*dir*/ ctx[0]);
    			add_render_callback(() => /*div1_elementresize_handler*/ ctx[14].call(div1));
    			add_location(div1, file$1, 29, 0, 894);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let layout;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-links-grid', slots, []);
    	let { siteurl } = $$props;
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { filter = 'Active eq 1' } = $$props;
    	let { limit } = $$props;
    	let { dir } = $$props;
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
    		'siteurl',
    		'weburl',
    		'list',
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
    		if ('siteurl' in $$props) $$invalidate(6, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(7, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(8, list = $$props.list);
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
    		siteurl,
    		weburl,
    		list,
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
    		if ('siteurl' in $$props) $$invalidate(6, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(7, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(8, list = $$props.list);
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
    		siteurl,
    		weburl,
    		list,
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
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				siteurl: 6,
    				weburl: 7,
    				list: 8,
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

    		if (/*siteurl*/ ctx[6] === undefined && !('siteurl' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'siteurl'");
    		}

    		if (/*weburl*/ ctx[7] === undefined && !('weburl' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[8] === undefined && !('list' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'list'");
    		}

    		if (/*limit*/ ctx[10] === undefined && !('limit' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'limit'");
    		}

    		if (/*dir*/ ctx[0] === undefined && !('dir' in props)) {
    			console.warn("<sp-links-grid> was created without expected prop 'dir'");
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
    			"siteurl",
    			"weburl",
    			"list",
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

    	get siteurl() {
    		return this.$$.ctx[6];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get weburl() {
    		return this.$$.ctx[7];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[8];
    	}

    	set list(list) {
    		this.$$set({ list });
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
    const file = "src\\components\\pageBrief.svelte";

    function create_fragment(ctx) {
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
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*page*/ ctx[6].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*page*/ ctx[6].Title);
    			attr_dev(img, "style", "");
    			add_location(img, file, 30, 8, 1281);
    			attr_dev(div0, "class", "image-box");
    			set_style(div0, "float", /*float*/ ctx[7]);
    			set_style(div0, "width", /*imageWidthPercentage*/ ctx[8] + "%");
    			add_location(div0, file, 29, 4, 1192);
    			add_location(h3, file, 34, 12, 1526);
    			add_location(p, file, 35, 12, 1561);
    			add_location(div1, file, 33, 8, 1507);
    			attr_dev(div2, "class", "content-box");
    			set_style(div2, "float", /*float*/ ctx[7]);

    			set_style(div2, "width", (/*imageWidthPercentage*/ ctx[8] == 100
    			? 100
    			: 100 - /*imageWidthPercentage*/ ctx[8]) + "%");

    			set_style(div2, "color", /*textcolor*/ ctx[3]);
    			add_location(div2, file, 32, 4, 1355);
    			set_style(div3, "clear", "both");
    			add_location(div3, file, 38, 4, 1636);
    			attr_dev(div4, "class", div4_class_value = "page " + /*dir*/ ctx[0]);
    			attr_dev(div4, "dir", /*dir*/ ctx[0]);
    			set_style(div4, "height", /*isMobile*/ ctx[5] ? 'auto' : /*height*/ ctx[1] + 'px');
    			set_style(div4, "background-color", /*backgroundcolor*/ ctx[2]);
    			add_render_callback(() => /*div4_elementresize_handler*/ ctx[15].call(div4));
    			add_location(div4, file, 28, 0, 1030);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    			div4_resize_listener = add_resize_listener(div4, /*div4_elementresize_handler*/ ctx[15].bind(div4));
    		},
    		p: function update(ctx, [dirty]) {
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			div4_resize_listener();
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
    	let isMobile;
    	let imageWidthPercentage;
    	let float;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('sp-page-brief', slots, []);
    	let { siteurl } = $$props;
    	let { weburl } = $$props;
    	let { list } = $$props;
    	let { pageid } = $$props;
    	let { dir } = $$props;
    	let { imageisend } = $$props;
    	let { height = 400 } = $$props;
    	let { smallwidth = 768 } = $$props;
    	let { backgroundcolor = '#fff' } = $$props;
    	let { textcolor = '#333' } = $$props;
    	let fullWidth = 1;
    	let page = {};

    	onMount(async () => {
    		var pagesRes = await fetch(`${siteurl}/${weburl}/_api/web/Lists(guid'${list}')/items(${pageid})/FieldValuesAsHtml`, options);
    		$$invalidate(6, page = (await pagesRes.json()).d);
    		var element = document.createElement('DIV');
    		element.innerHTML = page.PublishingRollupImage;
    		$$invalidate(6, page.imageUrl = `${siteurl}${element.firstElementChild.attributes['src'].nodeValue}`, page);
    	});

    	const writable_props = [
    		'siteurl',
    		'weburl',
    		'list',
    		'pageid',
    		'dir',
    		'imageisend',
    		'height',
    		'smallwidth',
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
    		if ('siteurl' in $$props) $$invalidate(9, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(10, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(11, list = $$props.list);
    		if ('pageid' in $$props) $$invalidate(12, pageid = $$props.pageid);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('imageisend' in $$props) $$invalidate(13, imageisend = $$props.imageisend);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(14, smallwidth = $$props.smallwidth);
    		if ('backgroundcolor' in $$props) $$invalidate(2, backgroundcolor = $$props.backgroundcolor);
    		if ('textcolor' in $$props) $$invalidate(3, textcolor = $$props.textcolor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		siteurl,
    		weburl,
    		list,
    		pageid,
    		dir,
    		imageisend,
    		height,
    		smallwidth,
    		backgroundcolor,
    		textcolor,
    		fullWidth,
    		page,
    		float,
    		isMobile,
    		imageWidthPercentage
    	});

    	$$self.$inject_state = $$props => {
    		if ('siteurl' in $$props) $$invalidate(9, siteurl = $$props.siteurl);
    		if ('weburl' in $$props) $$invalidate(10, weburl = $$props.weburl);
    		if ('list' in $$props) $$invalidate(11, list = $$props.list);
    		if ('pageid' in $$props) $$invalidate(12, pageid = $$props.pageid);
    		if ('dir' in $$props) $$invalidate(0, dir = $$props.dir);
    		if ('imageisend' in $$props) $$invalidate(13, imageisend = $$props.imageisend);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('smallwidth' in $$props) $$invalidate(14, smallwidth = $$props.smallwidth);
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
    		siteurl,
    		weburl,
    		list,
    		pageid,
    		imageisend,
    		smallwidth,
    		div4_elementresize_handler
    	];
    }

    class PageBrief extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.page{padding:25px 1%;box-sizing:border-box;margin-bottom:14px}img{display:block;border:none;border-radius:10px;width:100%}.image-box{padding:0 1%;box-sizing:border-box}.content-box{padding:0 1%;box-sizing:border-box}</style>`;

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
    			{
    				siteurl: 9,
    				weburl: 10,
    				list: 11,
    				pageid: 12,
    				dir: 0,
    				imageisend: 13,
    				height: 1,
    				smallwidth: 14,
    				backgroundcolor: 2,
    				textcolor: 3
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*siteurl*/ ctx[9] === undefined && !('siteurl' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'siteurl'");
    		}

    		if (/*weburl*/ ctx[10] === undefined && !('weburl' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'weburl'");
    		}

    		if (/*list*/ ctx[11] === undefined && !('list' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'list'");
    		}

    		if (/*pageid*/ ctx[12] === undefined && !('pageid' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'pageid'");
    		}

    		if (/*dir*/ ctx[0] === undefined && !('dir' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'dir'");
    		}

    		if (/*imageisend*/ ctx[13] === undefined && !('imageisend' in props)) {
    			console.warn("<sp-page-brief> was created without expected prop 'imageisend'");
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
    			"siteurl",
    			"weburl",
    			"list",
    			"pageid",
    			"dir",
    			"imageisend",
    			"height",
    			"smallwidth",
    			"backgroundcolor",
    			"textcolor"
    		];
    	}

    	get siteurl() {
    		return this.$$.ctx[9];
    	}

    	set siteurl(siteurl) {
    		this.$$set({ siteurl });
    		flush();
    	}

    	get weburl() {
    		return this.$$.ctx[10];
    	}

    	set weburl(weburl) {
    		this.$$set({ weburl });
    		flush();
    	}

    	get list() {
    		return this.$$.ctx[11];
    	}

    	set list(list) {
    		this.$$set({ list });
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

    var main = [Slider, Cards, LinksGrid, PageBrief];

    return main;

})();
//# sourceMappingURL=bundle.js.map
