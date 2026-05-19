"""
Theme configuration for the Edmonton Transit Equity Dashboard.
"""

# ----------------------------------------------------------------------------
# THEME DEFINITIONS
# ----------------------------------------------------------------------------

THEMES = {
    'river_valley': {
        'name': 'River Valley (Default)',
        'id': 'river_valley',
        'colors': {
            'green_900': '#0d3b22', 'green_800': '#1a5c3a', 'green_600': '#2d8f6f',
            'green_400': '#43b692', 'green_200': '#b2dfcc', 'green_100': '#e6f5ec',
            'green_50':  '#f0f9f4', 'sun_gold':  '#f5c542', 'sun_cream': '#fef9e7',
            'amber':     '#e8a735', 'coral':     '#e05c5c', 'sky_blue':  '#5bb5d5',
            'text_primary':   '#1a3a2a', 'text_secondary': '#5a7a6a',
            'white':          '#ffffff', 'bg':             '#f0f9f4',
            'bg_subtle':      '#f0f9f4', 'border':         '#b2dfcc', 'border_light': '#e6f5ec',
            'lrt_blue':       '#0066FF', 'bus_hf_purple':  '#8B00FF', 'bus_reg_black': '#000000',
            'emerald_brand':  '#43b692'
        },
        'scale': ['#e05c5c', '#e8a735', '#f5c542', '#43b692', '#1a3a2a']
    },
    'midnight_slate': {
        'name': 'Midnight Slate (Premium)',
        'id': 'midnight_slate',
        'colors': {
            'green_900': '#0f172a', 'green_800': '#1e293b', 'green_600': '#334155',
            'green_400': '#10b981', 'green_200': '#6ee7b7', 'green_100': '#ecfdf5',
            'green_50':  '#f8fafc', 'sun_gold':  '#f59e0b', 'sun_cream': '#fffbeb',
            'amber':     '#f59e0b', 'coral':     '#ef4444', 'sky_blue':  '#0ea5e9',
            'text_primary':   '#0f172a', 'text_secondary': '#64748b',
            'white':          '#ffffff', 'bg':             '#f8fafc',
            'bg_subtle':      '#f1f5f9', 'border':         '#e2e8f0', 'border_light': '#f1f5f9',
            'lrt_blue':       '#2563eb', 'bus_hf_purple':  '#8b5cf6', 'bus_reg_black': '#334155',
            'emerald_brand':  '#10b981'
        },
        'scale': ['#ef4444', '#f59e0b', '#facc15', '#34d399', '#059669']
    }
}

# ----------------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------------

def fetch_colors(theme_id='river_valley'):
    """Return the color dictionary for a given theme."""
    t = THEMES.get(theme_id, THEMES['river_valley'])
    return t['colors']

def fetch_scale(theme_id='river_valley'):
    """Return the choropleth color scale for a given theme."""
    t = THEMES.get(theme_id, THEMES['river_valley'])
    return t['scale']

def get_chart_template(theme_id='river_valley'):
    """Generate a Plotly chart template based on selected theme."""
    c = fetch_colors(theme_id)
    plot_bg = '#f8fafc' if theme_id == 'midnight_slate' else c['green_50']
    grid = '#e2e8f0' if theme_id == 'midnight_slate' else c['green_100']
    zero = '#cbd5e1' if theme_id == 'midnight_slate' else c['green_200']
    
    return dict(layout=dict(
        font=dict(family='Inter, sans-serif', color=c['text_primary']),
        paper_bgcolor=c['white'], 
        plot_bgcolor=plot_bg,
        margin=dict(l=40, r=20, t=40, b=40),
        xaxis=dict(gridcolor=grid, zerolinecolor=zero),
        yaxis=dict(gridcolor=grid, zerolinecolor=zero),
    ))

# Legacy Fallbacks (default to river_valley)
COLORS = THEMES['river_valley']['colors']
CHOROPLETH_SCALE = THEMES['river_valley']['scale']
CHART_TEMPLATE = get_chart_template('river_valley')

def get_theme_css(theme_id='river_valley'):
    """Return CSS variable overrides for the selected theme.
    
    We inject a complete override set so that ALL components (sidebar, header,
    cards, borders, table cells, modal, metric strips, etc.) correctly adopt
    the active palette without any residual leak from the :root defaults.
    """
    if theme_id == 'midnight_slate':
        return """
        :root {
            /* Backgrounds */
            --bg-primary:         #f8fafc;
            --bg-card:            #ffffff;
            --bg-sidebar:         #0f172a;
            --bg-sidebar-hover:   #1e293b;
            --bg-sidebar-active:  #334155;
            --bg-header: linear-gradient(135deg, #0f172a, #1e293b);

            /* Full Slate/Blue-Grey Scale */
            --green-50:  #f8fafc;
            --green-100: #f1f5f9;
            --green-200: #e2e8f0;
            --green-300: #cbd5e1;
            --green-400: #10b981;
            --green-500: #059669;
            --green-600: #047857;
            --green-700: #334155;
            --green-800: #1e293b;
            --green-900: #0f172a;

            /* Accents */
            --sun-gold:        #f59e0b;
            --sun-cream:       #fffbeb;
            --amber-warning:   #f59e0b;
            --coral-alert:     #ef4444;
            --sky-blue:        #0ea5e9;
            --emerald-brand:   #10b981;

            /* Text */
            --text-primary:   #0f172a;
            --text-secondary: #64748b;

            /* Borders & Shadows (slate-toned) */
            --border:       rgba(15, 23, 42, 0.1);
            --border-light: rgba(15, 23, 42, 0.05);
            --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
            --shadow-xl: 0 20px 25px -5px rgba(15, 23, 42, 0.1);
        }
        """
    else:
        # River Valley — restores defaults (matches :root in styles.css)
        return """
        :root {
            /* Backgrounds */
            --bg-primary:         #f0f9f4;
            --bg-card:            #ffffff;
            --bg-sidebar:         #1a5c3a;
            --bg-sidebar-hover:   #237a4d;
            --bg-sidebar-active:  #145030;
            --bg-header: linear-gradient(135deg, #43b692, #2d8f6f);

            /* Full River Valley Green Scale */
            --green-50:  #f0f9f4;
            --green-100: #e6f5ec;
            --green-200: #b2dfcc;
            --green-300: #7ecbaa;
            --green-400: #43b692;
            --green-500: #2d8f6f;
            --green-600: #246b55;
            --green-700: #1a5c3a;
            --green-800: #1a3c2e;
            --green-900: #0d3b22;

            /* Accents */
            --sun-gold:        #f5c542;
            --sun-cream:       #fef9e7;
            --amber-warning:   #e8a735;
            --coral-alert:     #e05c5c;
            --sky-blue:        #5bb5d5;
            --emerald-brand:   #43b692;

            /* Text */
            --text-primary:   #1a3a2a;
            --text-secondary: #5a7a6a;

            /* Borders & Shadows (green-toned) */
            --border:       rgba(26, 58, 42, 0.12);
            --border-light: rgba(26, 58, 42, 0.06);
            --shadow-sm: 0 1px 2px rgba(26, 58, 42, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(26, 58, 42, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(26, 58, 42, 0.1);
            --shadow-xl: 0 20px 25px -5px rgba(26, 58, 42, 0.1);
        }
        """

