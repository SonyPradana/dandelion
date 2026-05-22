use std::collections::HashSet;
use ratatui::{
    layout::{Constraint, Direction, Layout, Margin, Rect},
    style::{Color, Modifier, Style, Stylize},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Wrap},
    Frame,
};

use crate::jwt;

const ALL_FEATURES: &[&str] = &[
    "skriningform",
    "skrining",
    "skrining-form-not-checked",
    "zen-mode",
];

#[derive(Debug, Clone)]
pub struct TextField {
    pub value: String,
    pub label: &'static str,
    pub required: bool,
}

impl TextField {
    fn new(label: &'static str, required: bool) -> Self {
        Self { value: String::new(), label, required }
    }

    fn default_value(&self) -> &'static str {
        match self.label {
            "Expiry" => "90d",
            "Total Limit (points)" => "30000",
            "Daily Limit" => "150",
            "Version Allowed" => "1.0.0,1.1.0",
            _ => "",
        }
    }

    fn display(&self) -> String {
        if self.value.is_empty() {
            self.default_value().to_string()
        } else {
            self.value.clone()
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Focus {
    PrivateKey,
    TokenId,
    Expiry,
    TotalLimit,
    DailyLimit,
    VersionAllowed,
    Features,
    Generate,
    Copy,
}

pub struct App {
    pub private_key: TextField,
    pub token_id: TextField,
    pub expiry: TextField,
    pub total_limit: TextField,
    pub daily_limit: TextField,
    pub version_allowed: TextField,
    pub features: HashSet<String>,
    pub focus: Focus,
    pub result: Option<String>,
    pub error: Option<String>,
    pub summary: Vec<(String, String)>,
    pub copied: bool,
    pub feature_cursor: usize,
}

impl App {
    pub fn new() -> Self {
        let mut app = Self {
            private_key: TextField::new("Private Key (PEM)", false),
            token_id: TextField::new("Token ID", true),
            expiry: TextField::new("Expiry", false),
            total_limit: TextField::new("Total Limit (points)", false),
            daily_limit: TextField::new("Daily Limit", false),
            version_allowed: TextField::new("Version Allowed", false),
            features: ALL_FEATURES.iter().map(|s| s.to_string()).collect(),
            focus: Focus::PrivateKey,
            result: None,
            error: None,
            summary: Vec::new(),
            copied: false,
            feature_cursor: 0,
        };

        if let Ok(content) = std::fs::read_to_string("keys/license-priv.pem") {
            app.private_key.value = content;
        }

        app
    }

    pub fn new_with_path(pem_path: &str) -> Self {
        let mut app = Self::new();
        app.private_key.value = std::fs::read_to_string(pem_path).unwrap_or_default();
        app
    }

    pub fn focus_next(&mut self) {
        self.focus = match self.focus {
            Focus::PrivateKey => Focus::TokenId,
            Focus::TokenId => Focus::Expiry,
            Focus::Expiry => Focus::TotalLimit,
            Focus::TotalLimit => Focus::DailyLimit,
            Focus::DailyLimit => Focus::VersionAllowed,
            Focus::VersionAllowed => Focus::Features,
            Focus::Features => Focus::Generate,
            Focus::Generate => Focus::Copy,
            Focus::Copy => Focus::PrivateKey,
        };
    }

    pub fn focus_prev(&mut self) {
        self.focus = match self.focus {
            Focus::PrivateKey => Focus::Copy,
            Focus::TokenId => Focus::PrivateKey,
            Focus::Expiry => Focus::TokenId,
            Focus::TotalLimit => Focus::Expiry,
            Focus::DailyLimit => Focus::TotalLimit,
            Focus::VersionAllowed => Focus::DailyLimit,
            Focus::Features => Focus::VersionAllowed,
            Focus::Generate => Focus::Features,
            Focus::Copy => Focus::Generate,
        };
    }

    pub fn handle_char(&mut self, ch: char) {
        if let Focus::Features = self.focus {
            return;
        }
        let field = match self.focus {
            Focus::PrivateKey => &mut self.private_key,
            Focus::TokenId => &mut self.token_id,
            Focus::Expiry => &mut self.expiry,
            Focus::TotalLimit => &mut self.total_limit,
            Focus::DailyLimit => &mut self.daily_limit,
            Focus::VersionAllowed => &mut self.version_allowed,
            _ => return,
        };
        field.value.push(ch);
    }

    pub fn handle_backspace(&mut self) {
        if let Focus::Features = self.focus {
            return;
        }
        let field = match self.focus {
            Focus::PrivateKey => &mut self.private_key,
            Focus::TokenId => &mut self.token_id,
            Focus::Expiry => &mut self.expiry,
            Focus::TotalLimit => &mut self.total_limit,
            Focus::DailyLimit => &mut self.daily_limit,
            Focus::VersionAllowed => &mut self.version_allowed,
            _ => return,
        };
        field.value.pop();
    }

    pub fn handle_space(&mut self) {
        if !matches!(self.focus, Focus::Features) {
            return;
        }
        let name = ALL_FEATURES[self.feature_cursor];
        if self.features.contains(name) {
            self.features.remove(name);
        } else {
            self.features.insert(name.to_string());
        }
    }

    pub fn handle_ctrl_o(&mut self) {
        self.error = None;
        self.result = None;
        self.summary.clear();

        let path = self.private_key.value.trim().to_string();
        if path.is_empty() {
            self.error = Some("No path specified. Type a path in Private Key Path field.".to_string());
            return;
        }
        if path.starts_with("-----BEGIN") {
            self.result = Some("PEM content already loaded in field.".to_string());
            return;
        }
        match std::fs::read_to_string(&path) {
            Ok(content) => {
                let len = content.len();
                self.private_key.value = content;
                self.result = Some(format!("Loaded {len} bytes from {path}"));
            }
            Err(e) => {
                self.error = Some(format!("Cannot read {path}: {e}"));
            }
        }
    }

    pub fn handle_enter(&mut self) {
        match self.focus {
            Focus::PrivateKey => self.private_key.value.push('\n'),
            Focus::Generate => self.generate(),
            Focus::Copy => self.copy_result(),
            _ => {}
        }
    }

    fn read_pem(&self) -> Result<String, String> {
        let val = self.private_key.value.trim();
        if val.is_empty() {
            let cwd = std::env::current_dir().map_err(|e| format!("Cannot get current dir: {e}"))?;
            return std::fs::read_to_string(cwd.join("keys").join("license-priv.pem"))
                .map_err(|e| format!("Cannot read default keys/license-priv.pem: {e}"));
        }
        if val.starts_with("-----BEGIN") {
            return Ok(val.to_string());
        }
        std::fs::read_to_string(val)
            .map_err(|e| format!("Cannot read private key at {val}: {e}"))
    }

    pub fn generate(&mut self) {
        self.error = None;
        self.result = None;
        self.summary.clear();

        let private_key_pem = match self.read_pem() {
            Ok(p) => p,
            Err(e) => { self.error = Some(e); return; }
        };

        if self.token_id.value.trim().is_empty() {
            self.error = Some("Token ID is required.".to_string());
            return;
        }

        let expiry = self.expiry.display();
        let total_limit: u64 = self.total_limit.display().parse().unwrap_or(0);
        let daily_limit: u64 = self.daily_limit.display().parse().unwrap_or(100);
        let version_allowed = self.version_allowed.display();

        let exp_ts;
        match jwt::generate_token(
            &private_key_pem,
            self.token_id.value.trim(),
            &expiry,
            total_limit,
            daily_limit,
            &version_allowed,
            &self.features,
        ) {
            Ok((token, exp)) => {
                exp_ts = exp;
                self.result = Some(token);
            }
            Err(e) => { self.error = Some(e); return; }
        }

        let feature_list: Vec<String> = if self.features.is_empty() {
            ALL_FEATURES.iter().map(|s| s.to_string()).collect()
        } else {
            let mut v: Vec<String> = self.features.iter().cloned().collect();
            v.sort();
            v
        };

        let exp_str = chrono::DateTime::from_timestamp(exp_ts as i64, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default();

        self.summary = vec![
            ("Token ID".to_string(), self.token_id.value.trim().to_string()),
            ("Features".to_string(), feature_list.join(", ")),
            ("Total limit".to_string(), format!("{total_limit} ({}unlimited)", if total_limit == 0 { "" } else { "not " })),
            ("Daily limit".to_string(), daily_limit.to_string()),
            ("Version allowed".to_string(), version_allowed),
            ("Expires".to_string(), exp_str),
        ];
    }

    pub fn handle_mouse(&mut self, row: u16, _col: u16, area_width: u16) {
        // Title is 3 rows, form starts at Y=3 with margin(1)
        let rel = row.saturating_sub(4);
        match rel {
            0..=9 => self.focus = Focus::PrivateKey,
            10..=12 => self.focus = Focus::TokenId,
            13..=15 => self.focus = Focus::Expiry,
            16..=18 => self.focus = Focus::TotalLimit,
            19..=21 => self.focus = Focus::DailyLimit,
            22..=24 => self.focus = Focus::VersionAllowed,
            25..=30 => self.focus = Focus::Features,
            31..=33 => {
                let mid = area_width / 4;
                self.focus = if _col < mid { Focus::Generate } else { Focus::Copy };
            }
            _ => {}
        }
    }

    pub fn copy_result(&mut self) {
        if let Some(ref token) = self.result.clone() {
            if cli_clipboard::set_contents(token.to_string()).is_ok() {
                self.copied = true;
            }
        }
    }

    pub fn render(&self, f: &mut Frame) {
        let area = f.area();

        let main_layout = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Length(3), Constraint::Min(0)])
            .split(area);

        let title = Paragraph::new("Dandelion — Token Generator")
            .style(Style::new().bold().fg(Color::Cyan))
            .alignment(ratatui::layout::Alignment::Center);
        f.render_widget(title, main_layout[0]);

        let inner = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(main_layout[1]);

        self.render_form(f, inner[0]);
        self.render_result(f, inner[1]);
    }

    fn render_form(&self, f: &mut Frame, area: Rect) {
        let field_areas = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(10),
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Length(6),
                Constraint::Length(3),
            ])
            .margin(1)
            .split(area);

        let fields: [(Focus, &TextField); 6] = [
            (Focus::PrivateKey, &self.private_key),
            (Focus::TokenId, &self.token_id),
            (Focus::Expiry, &self.expiry),
            (Focus::TotalLimit, &self.total_limit),
            (Focus::DailyLimit, &self.daily_limit),
            (Focus::VersionAllowed, &self.version_allowed),
        ];

        for (i, (focus, field)) in fields.iter().enumerate() {
            let is_focused = self.focus == *focus;
            let title = if field.required {
                format!("{} *", field.label)
            } else {
                field.label.to_string()
            };

            let block = Block::default()
                .borders(Borders::ALL)
                .title(title)
                .border_style(if is_focused {
                    Style::new().fg(Color::Cyan)
                } else {
                    Style::new().fg(Color::DarkGray)
                });

            let mut para = Paragraph::new(field.display()).block(block);
            if i == 0 {
                para = para.wrap(Wrap { trim: false });
            }
            f.render_widget(para, field_areas[i]);
        }

        // Features block
        let feat_focused = self.focus == Focus::Features;
        let feat_block = Block::default()
            .borders(Borders::ALL)
            .title("Features")
            .border_style(if feat_focused {
                Style::new().fg(Color::Cyan)
            } else {
                Style::new().fg(Color::DarkGray)
            });
        let feat_area = field_areas[6];
        f.render_widget(feat_block, feat_area);

        let inner = feat_area.inner(Margin { horizontal: 1, vertical: 1 });
        for (i, name) in ALL_FEATURES.iter().enumerate() {
            let checked = self.features.contains(*name);
            let marker = if checked { "[x]" } else { "[ ]" };
            let line = if feat_focused && i == self.feature_cursor {
                Line::from(vec![
                    Span::styled(format!("{marker} {name}"), Style::new().fg(Color::Cyan).add_modifier(Modifier::REVERSED)),
                ])
            } else {
                Line::from(vec![
                    Span::styled(format!("{marker} {name}"), Style::new().fg(Color::White)),
                ])
            };
            f.render_widget(Paragraph::new(line), Rect {
                x: inner.x,
                y: inner.y + i as u16,
                width: inner.width,
                height: 1,
            });
        }

        // Action buttons
        let action_areas = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(field_areas[7]);

        let gen_active = self.focus == Focus::Generate;
        let gen_style = if gen_active {
            Style::new().bg(Color::Cyan).fg(Color::Black).add_modifier(Modifier::BOLD)
        } else {
            Style::new().bg(Color::DarkGray).fg(Color::White)
        };
        f.render_widget(
            Paragraph::new(Line::from(Span::styled(" Generate ", gen_style)))
                .alignment(ratatui::layout::Alignment::Center),
            action_areas[0],
        );

        let copy_label = if self.copied { " Copied! " } else { " Copy " };
        let copy_active = self.focus == Focus::Copy;
        let copy_style = if copy_active {
            Style::new().bg(Color::Cyan).fg(Color::Black).add_modifier(Modifier::BOLD)
        } else {
            Style::new().bg(Color::DarkGray).fg(Color::White)
        };
        f.render_widget(
            Paragraph::new(Line::from(Span::styled(copy_label, copy_style)))
                .alignment(ratatui::layout::Alignment::Center),
            action_areas[1],
        );
    }

    fn render_result(&self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Min(3), Constraint::Min(0)])
            .margin(1)
            .split(area);

        if let Some(ref err) = self.error {
            f.render_widget(
                Paragraph::new(err.as_str())
                    .style(Style::new().fg(Color::Red))
                    .wrap(Wrap { trim: false }),
                chunks[0],
            );
        }

        if let Some(ref token) = self.result {
            f.render_widget(
                Paragraph::new(token.as_str())
                    .block(
                        Block::default()
                            .borders(Borders::ALL)
                            .title("Generated Token")
                            .border_style(Style::new().fg(Color::Green)),
                    )
                    .wrap(Wrap { trim: false }),
                chunks[0],
            );

            let mut lines = vec![
                Line::from(Span::styled("── Summary ──", Style::new().bold().fg(Color::Cyan))),
            ];
            for (k, v) in &self.summary {
                lines.push(Line::from(vec![
                    Span::styled(format!("  {k:<16} "), Style::new().fg(Color::DarkGray)),
                    Span::styled(v.as_str(), Style::new().fg(Color::White)),
                ]));
            }

            f.render_widget(
                Paragraph::new(lines).wrap(Wrap { trim: false }),
                chunks[1],
            );
        }
    }
}
