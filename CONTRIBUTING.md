# Contributing to Chameleon AI Chat

Thanks for your interest in contributing!

## Quick Links

- **Full Contributing Guide**: [docs/dev/contributing.md](./docs/dev/contributing.md)
- **Report a Bug**: [GitHub Issues](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=bug_report.md)
- **Request a Feature**: [GitHub Issues](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=feature_request.md)
- **Ask Questions**: [GitHub Discussions](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/discussions)

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## Before Submitting a PR

- Run `npm run lint` and fix any errors
- Test your changes locally
- Keep commits focused and descriptive
- Update docs if you're changing user-facing features

## Code Style

We use TypeScript with strict mode. Avoid `any` types when possible. Check out the [full guide](./docs/dev/contributing.md) for details on code standards and best practices.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
